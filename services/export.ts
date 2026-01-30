import { NovelNode } from "../types";

// Helper to recursively get text
const getAllText = (nodes: NovelNode[], level = 0): string => {
  let text = "";
  nodes.forEach(node => {
    const indent = "=".repeat(level + 1);
    text += `\n${indent} ${node.title} ${indent}\n\n`;
    if (node.content) text += node.content + "\n\n";
    if (node.children) text += getAllText(node.children, level + 1);
  });
  return text;
};

export const exportToTXT = (nodes: NovelNode[], title: string) => {
  const text = getAllText(nodes);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.txt`;
  link.click();
};

export const exportToDOC = (nodes: NovelNode[], title: string) => {
  // Simple HTML structure mimicking a Doc
  let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head><body>
    <h1>${title}</h1>
  `;
  
  const processNode = (n: NovelNode[], lvl: number) => {
    n.forEach(node => {
      const fontSize = Math.max(14, 24 - lvl * 2);
      htmlContent += `<h${Math.min(6, lvl + 2)} style="font-size:${fontSize}px; margin-top: 20px;">${node.title}</h${Math.min(6, lvl + 2)}>`;
      if (node.content) {
        htmlContent += `<p style="font-size:12pt; line-height:1.5; white-space: pre-wrap;">${node.content}</p>`;
      }
      if (node.children) processNode(node.children, lvl + 1);
    });
  };
  
  processNode(nodes, 0);
  htmlContent += "</body></html>";

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.doc`;
  link.click();
};

// Generate a Scrolling Text Video
export const exportToMP4 = async (content: string, title: string) => {
  if (!content) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1080; // FHD width
  canvas.height = 1920; // 9:16 Portrait or landscape
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); // Chrome supports webm usually
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.webm`; // Browser standard, can be renamed to mp4 often
    a.click();
  };

  recorder.start();

  // Animation Loop to scroll text
  const fontSize = 40;
  ctx.font = `${fontSize}px 'Times New Roman', serif`;
  ctx.fillStyle = '#e2e8f0';
  
  const lines = wrapText(ctx, content, canvas.width - 100);
  let y = canvas.height; 
  const totalHeight = lines.length * (fontSize + 20) + canvas.height;
  
  const scrollSpeed = 2; // px per frame

  return new Promise<void>((resolve) => {
    const animate = () => {
      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Text
      ctx.fillStyle = '#e2e8f0';
      lines.forEach((line, i) => {
        const lineY = y + i * (fontSize + 20);
        if (lineY > -50 && lineY < canvas.height + 50) {
           ctx.fillText(line, 50, lineY);
        }
      });

      y -= scrollSpeed;

      if (y + lines.length * (fontSize + 20) < 0) {
        recorder.stop();
        resolve();
      } else {
        requestAnimationFrame(animate);
      }
    };
    animate();
  });
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
