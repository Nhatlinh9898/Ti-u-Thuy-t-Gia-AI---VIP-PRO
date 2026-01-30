import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NodeType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

// Specific System Instruction as requested
const SYSTEM_INSTRUCTION = `
Bạn là hệ thống AI chuyên dụng cho việc viết tiểu thuyết. 
Nhiệm vụ của bạn là đảm bảo trải nghiệm liền mạch từ lúc tạo dự án → nhập ý tưởng → viết từng node → kết thúc → chuyển cảnh → nối sang node tiếp theo.

NGUYÊN TẮC CỐT LÕI:
1. Luôn đảm bảo trải nghiệm liền mạch.
2. Không tạo cảm giác rời rạc.
3. KHÔNG ĐƯỢC XUẤT RA các dòng thông báo hệ thống như "[Hệ thống]...". Chỉ tập trung vào nội dung văn học.

NGUYÊN TẮC BÁM THEO Ý TƯỞNG GỐC (CORE STORY LOCK):
Mọi nội dung bạn viết phải bám theo:
- Ý tưởng gốc của Project (Được cung cấp chính xác trong Core Lock).
- Tóm tắt tổng quan (Overview).
- Cấu trúc truyện đã được tạo.
- Không được thay đổi thể loại, tông giọng, chủ đề, hướng phát triển chính.
- Không được tự tạo hướng truyện mới không liên quan.
- Không được thay đổi tính cách nhân vật một cách bất hợp lý.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateNovelContent = async (
  promptType: string,
  nodeType: NodeType,
  contextPath: string,
  currentContent: string,
  extraParams?: { 
    style?: string; 
    topic?: string; 
    nextNodeTitle?: string;
    previousContext?: string;
    projectOverview?: string; // Core Story Lock Context
  }
): Promise<string> => {
  let prompt = "";
  let responseSchema: Schema | undefined = undefined;
  let mimeType = "text/plain";

  // Build the Core Story Lock block
  const coreLockContext = extraParams?.projectOverview 
    ? `\n=== CORE STORY LOCK (DỮ LIỆU CỐ ĐỊNH - KHÔNG ĐƯỢC LÀM SAI LỆCH) ===\nTỔNG QUAN DỰ ÁN: ${extraParams.projectOverview}\n==============================\n` 
    : "";

  switch (promptType) {
    case 'NEW_PROJECT':
      prompt = `
      NGƯỜI DÙNG MUỐN TẠO DỰ ÁN TIỂU THUYẾT MỚI.
      Ý tưởng/Cốt truyện đầu vào: "${extraParams?.topic}"
      
      Hãy đóng vai kiến trúc sư tiểu thuyết:
      1. Đặt tên tiểu thuyết hấp dẫn.
      2. Tóm tắt ý tưởng chi tiết (Summary).
      3. Viết Tóm tắt tổng quan (Overview): Phải bao gồm và giữ nguyên ý tưởng gốc của người dùng, sau đó mở rộng thêm về tone, theme. Không được thay đổi bản chất ý tưởng gốc.
      4. Đề xuất cấu trúc phân cấp ban đầu (Ví dụ: 3 Phần hoặc 5 Chương khởi đầu).
      
      Xuất ra JSON.
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          overview: { type: Type.STRING, description: "Bao gồm ý tưởng gốc và định hướng mở rộng." },
          structure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["PART", "CHAPTER"] }
              },
              required: ["title", "summary", "type"]
            }
          }
        },
        required: ["title", "summary", "overview", "structure"]
      };
      break;

    case 'WRITE':
      prompt = `
      ${coreLockContext}
      QUY TẮC VIẾT NỘI DUNG NODE [${contextPath} -> ${nodeType}]:
      
      Bối cảnh/Tóm tắt node trước (Context):
      ${extraParams?.previousContext || "Chưa có dữ liệu trước đó."}

      Yêu cầu:
      - BÁM SÁT CORE STORY LOCK ở trên. Tuyệt đối không mâu thuẫn với Cốt Truyện Gốc.
      - Giữ đúng mạch truyện và phong cách.
      - Viết chi tiết, miêu tả sâu nhân vật, bối cảnh, cảm xúc (khoảng 2000-4000 tokens).
      - TUYỆT ĐỐI KHÔNG giải thích, chỉ viết nội dung truyện.
      - KHÔNG viết các dòng thông báo hệ thống.
      
      Chủ đề viết tiếp: ${extraParams?.topic || "Tiếp diễn mạch truyện hiện tại theo logic"}
      
      Nội dung hiện tại của node này (để viết tiếp):
      ${currentContent.substring(currentContent.length - 5000)}
      `;
      break;

    case 'CONNECT_NODES':
      prompt = `
      ${coreLockContext}
      QUY TẮC VIẾT NỐI TIẾP LIỀN LẠC (SEAMLESS BRIDGE):
      Hiện tại đang ở cuối node: [${contextPath}].
      Cần chuyển sang node tiếp theo: [${extraParams?.nextNodeTitle}].

      Nhiệm vụ: Viết một đoạn chuyển tiếp mượt mà để nối 2 phần này lại với nhau.
      1. "endCurrent": Viết đoạn kết cho node hiện tại, giải quyết tình huống đang dang dở, tạo đà chuyển cảnh.
      2. "startNext": Viết đoạn mở đầu cho node tiếp theo, tiếp nhận đà chuyển cảnh đó để bắt đầu nội dung mới một cách tự nhiên nhất.

      Yêu cầu:
      - Văn phong liền mạch, không gượng ép.
      - Phù hợp với Core Story Lock.
      - Output JSON.

      Nội dung cuối của node hiện tại:
      ${currentContent.substring(currentContent.length - 2000)}
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          endCurrent: { type: Type.STRING, description: "Đoạn kết thúc cho node hiện tại" },
          startNext: { type: Type.STRING, description: "Đoạn mở đầu cho node kế tiếp" }
        },
        required: ["endCurrent", "startNext"]
      };
      break;

    case 'END_TRANSITION':
      prompt = `
      ${coreLockContext}
      QUY TẮC VIẾT KẾT THÚC (CLOSING):
      Viết đoạn kết thúc cho node: [${contextPath}].
      
      Node tiếp theo (nếu có): "${extraParams?.nextNodeTitle || 'Chưa xác định'}".
      
      Yêu cầu:
      1. Viết đoạn KẾT THÚC súc tích, lắng đọng hoặc kịch tính (cliffhanger) tùy ngữ cảnh.
      2. Viết đoạn CHUYỂN CẢNH (Transition ideas) để người dùng biết hướng đi tiếp theo.
      3. Gợi ý nội dung nên viết ở phần sau.
      
      Output JSON.
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          KetThuc: { type: Type.STRING },
          ChuyenCanh: { type: Type.STRING },
          GoiYNoiDungTiepTheo: { type: Type.STRING },
          HuongToiNodeTiepTheo: { type: Type.STRING, description: "Giải thích ngắn gọn cách kết nối" },
        },
        required: ["KetThuc", "ChuyenCanh", "GoiYNoiDungTiepTheo", "HuongToiNodeTiepTheo"],
      };
      break;

    case 'CONTINUITY_CHECK':
      prompt = `
      ${coreLockContext}
      MODULE KIỂM TRA MẠCH TRUYỆN (CONTINUITY CHECKER)
      
      Hãy kiểm tra tính liền mạch giữa CORE STORY LOCK (đặc biệt là Cốt Truyện Gốc), bối cảnh trước đó và nội dung hiện tại.
      
      Bối cảnh/Tóm tắt node trước:
      ${extraParams?.previousContext || "N/A"}
      
      Nội dung hiện tại:
      ${currentContent.substring(0, 5000)}...
      
      Xuất ra JSON đánh giá chi tiết.
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          TinhOnDinhNhanVat: { type: Type.STRING, description: "Đánh giá tính nhất quán của nhân vật" },
          TinhLienMachSuKien: { type: Type.STRING, description: "Đánh giá logic sự kiện" },
          LoiKhuyenDieuChinh: { type: Type.STRING, description: "Gợi ý sửa đổi nếu có mâu thuẫn" },
        },
        required: ["TinhOnDinhNhanVat", "TinhLienMachSuKien", "LoiKhuyenDieuChinh"],
      };
      break;

    case 'SUMMARIZE':
      prompt = `
      ${coreLockContext}
      Tóm tắt nội dung node [${nodeType}] để dùng cho context của các node sau.
      Giữ lại các chi tiết quan trọng về nhân vật, sự kiện và các manh mối (foreshadowing).
      Output JSON.
      Nội dung: ${currentContent}
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: { Node: { type: Type.STRING }, TomTat: { type: Type.STRING } },
        required: ["Node", "TomTat"]
      };
      break;

    case 'TITLE':
      prompt = `Đọc nội dung sau và đặt 01 tiêu đề ngắn gọn, đậm chất văn học, phù hợp thể loại. Trả về text thuần. Nội dung: ${currentContent.substring(0, 1000)}`;
      break;

    case 'STRUCTURE':
      prompt = `
      ${coreLockContext}
      Đề xuất cấu trúc con (JSON Array) cho [${nodeType}] "${contextPath}". 
      Chủ đề mong muốn: ${extraParams?.topic || "Triển khai theo mạch truyện"}.
      Đảm bảo cấu trúc phù hợp với Overview của dự án.
      `;
      mimeType = "application/json";
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { title: { type: Type.STRING }, summary: { type: Type.STRING } },
          required: ["title", "summary"]
        }
      };
      break;
      
    case 'INTRO_STYLE':
       prompt = `Viết đoạn dẫn nhập phong cách ${extraParams?.style}. 3-5 câu. Text thuần.`;
       break;

    default:
      prompt = "Yêu cầu không hợp lệ.";
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: mimeType,
          responseSchema: responseSchema,
        }
      });

      return response.text || "";
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

      // Check for retryable errors (429 Too Many Requests, 503 Service Unavailable)
      const isRetryable = 
        error?.status === 429 || 
        error?.status === 503 || 
        (error?.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exhausted')));

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt) * 2000;
        console.log(`Rate limit hit. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        attempt++;
        continue;
      }

      // If we're out of retries or it's a different error
      if (isRetryable) {
         throw new Error("Hệ thống đang quá tải (429 - Hết hạn mức). Vui lòng đợi 1 phút và thử lại.");
      }
      
      throw new Error(`Lỗi kết nối Siêu Trí Tuệ: ${error?.message || "Không xác định"}`);
    }
  }
  return "";
};
