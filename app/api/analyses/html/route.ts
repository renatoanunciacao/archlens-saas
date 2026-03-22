import { analyses, projects } from "@/app/db/schema";
import { readFile, rm } from "fs/promises";

import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { eq } from "drizzle-orm";
import { exec } from "child_process";
import { getServerSession } from "next-auth";
import { join } from "path";
import { promisify } from "util";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// Function to wrap ArchLens HTML with premium styling
function wrapHtmlWithStyling(archLensHtml: string, projectName: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📊 ArchLens Report - ${projectName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #f8f9fb 0%, #f0f4ff 100%);
      color: #0f172a;
      line-height: 1.6;
      transition: background 300ms ease, color 300ms ease;
    }

    html.dark body {
      background: linear-gradient(135deg, #0a0f1f 0%, #0f1a2e 100%);
      color: #f1f5f9;
    }

    .archlens-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Modern Premium Header */
    .archlens-header {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #0ea5e9 100%);
      color: white;
      padding: 3rem 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
    }

    .archlens-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .archlens-header-content {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
    }

    .archlens-header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .archlens-header-meta {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      flex-wrap: wrap;
      font-size: 0.95rem;
      opacity: 0.95;
    }

    .archlens-header-meta span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    html.dark .archlens-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #0e7490 50%, #0369a1 100%);
      box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
    }

    .archlens-content {
      flex: 1;
      padding: 3rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* Card System */
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e8ecf1;
      transition: all 300ms ease;
    }

    html.dark .card {
      background: #1e293b;
      border-color: #334155;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .card:hover {
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    html.dark .card:hover {
      box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);
      border-color: #06b6d4;
    }

    .card h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #0f172a;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    html.dark .card h2 {
      color: #f1f5f9;
      border-bottom-color: #06b6d4;
    }

    .card h3 {
      font-size: 1.15rem;
      margin: 1.5rem 0 1rem;
      color: #0f172a;
      font-weight: 600;
    }

    html.dark .card h3 {
      color: #f1f5f9;
    }

    .card p {
      color: #475569;
      line-height: 1.8;
      margin: 0.75rem 0;
    }

    html.dark .card p {
      color: #cbd5e1;
    }

    /* Tables */
    .card table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .card thead {
      background: linear-gradient(135deg, #f0f4ff 0%, #e0f2ff 100%);
    }

    html.dark .card thead {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f2847 100%);
    }

    .card th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #0f172a;
      border-bottom: 2px solid #3b82f6;
    }

    html.dark .card th {
      color: #f1f5f9;
      border-bottom-color: #06b6d4;
    }

    .card td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e8ecf1;
    }

    html.dark .card td {
      border-bottom-color: #334155;
    }

    .card tbody tr:hover {
      background: #f8fafc;
    }

    html.dark .card tbody tr:hover {
      background: #0f172a;
    }

    /* Metric Cards Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e8ecf1;
      transition: all 300ms ease;
    }

    html.dark .metric-card {
      background: #1e293b;
      border-color: #334155;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.9rem;
      color: #475569;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    html.dark .metric-label {
      color: #cbd5e1;
    }

    /* Health Score Bar */
    .health-score-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #f0fdff 100%);
      border: 2px solid #06b6d4;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      text-align: center;
    }

    html.dark .health-score-box {
      background: linear-gradient(135deg, #0f2847 0%, #0e5248 100%);
      border-color: #06b6d4;
    }

    .health-score-box h3 {
      color: #0369a1;
      font-size: 1rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    html.dark .health-score-box h3 {
      color: #67e8f9;
    }

    .health-score-value {
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #0369a1 0%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .health-score-status {
      font-size: 1.25rem;
      color: #10b981;
      font-weight: 600;
    }

    /* Lists */
    .card ul, .card ol {
      margin: 1rem 0 1rem 2rem;
    }

    .card li {
      margin: 0.75rem 0;
      color: #475569;
    }

    html.dark .card li {
      color: #cbd5e1;
    }

    /* Code blocks */
    .card code {
      background: #f3f4f6;
      color: #d97706;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }

    html.dark .card code {
      background: #1e293b;
      color: #fbbf24;
    }

    .card pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
      line-height: 1.4;
    }

    /* Footer */
    .archlens-footer {
      text-align: center;
      padding: 2rem;
      border-top: 1px solid #e8ecf1;
      color: #475569;
      font-size: 0.9rem;
      margin-top: auto;
      background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
    }

    html.dark .archlens-footer {
      border-top-color: #334155;
      color: #cbd5e1;
      background: linear-gradient(135deg, #0f172a 0%, #1a1f35 100%);
    }

    .archlens-footer p {
      margin: 0.25rem 0;
    }

    /* Badge styling */
    .badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      color: #1e40af;
    }

    html.dark .badge {
      background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
      color: #60a5fa;
    }

    /* Metrics Grid List - para listas de módulos */
    .metrics-grid-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .metric-item {
      background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 1.5rem;
      border-left: 4px solid #3b82f6;
      transition: all 300ms ease;
    }

    html.dark .metric-item {
      background: linear-gradient(135deg, #0f172a 0%, #1a1f35 100%);
      border-color: #1e3a8a;
      border-left-color: #06b6d4;
    }

    .metric-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.15);
    }

    .metric-item.critical {
      border-left-color: #f97316;
      background: linear-gradient(135deg, #fff7ed 0%, #fefce8 100%);
    }

    html.dark .metric-item.critical {
      background: linear-gradient(135deg, #2c1810 0%, #2d1f0f 100%);
      border-left-color: #f97316;
    }

    .metric-header {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
      word-break: break-word;
    }

    html.dark .metric-header {
      color: #f1f5f9;
    }

    .metric-details {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
      color: #475569;
    }

    html.dark .metric-details {
      color: #cbd5e1;
    }

    .metric-in, .metric-out {
      background: rgba(59, 130, 246, 0.1);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-weight: 500;
    }

    html.dark .metric-in, html.dark .metric-out {
      background: rgba(6, 182, 212, 0.15);
    }

    .metric-sep {
      opacity: 0.5;
    }

    /* Info Box - para informações destaque */
    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #dcfce7;
      border: 1px solid #86efac;
      border-left: 4px solid #10b981;
      border-radius: 10px;
      margin: 1.5rem 0;
      align-items: center;
    }

    html.dark .info-box {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
    }

    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .info-text {
      color: #065f46;
      font-weight: 500;
    }

    html.dark .info-text {
      color: #86efac;
    }

    /* Classification Grid */
    .classification-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .info-item {
      background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 1.25rem;
      transition: all 300ms ease;
    }

    html.dark .info-item {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      border-color: #475569;
    }

    .info-item:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    html.dark .info-item:hover {
      border-color: #06b6d4;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
    }

    .info-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    html.dark .info-label {
      color: #9ca3af;
    }

    .info-value {
      font-size: 1.1rem;
      color: #0f172a;
      font-weight: 600;
    }

    html.dark .info-value {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .archlens-header h1 {
        font-size: 1.75rem;
      }

      .archlens-header-meta {
        flex-direction: column;
        gap: 1rem;
      }

      .archlens-content {
        padding: 1.5rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .card {
        padding: 1.5rem;
      }

      .metrics-grid-list {
        grid-template-columns: 1fr;
      }

      .classification-grid {
        grid-template-columns: 1fr;
      }

      .info-box {
        flex-direction: column;
        text-align: center;
      }
    }

    /* Section divider */
    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3b82f6, transparent);
      margin: 3rem 0;
    }

    html.dark .section-divider {
      background: linear-gradient(90deg, transparent, #06b6d4, transparent);
    }
  </style>
</head>
<body>
  <div class="archlens-wrapper">
    <div class="archlens-header">
      <div class="archlens-header-content">
        <h1>📊 ArchLens Analysis Report</h1>
        <div class="archlens-header-meta">
          <span>🏗️ <strong>${escapeHtml(projectName)}</strong></span>
          <span>⏰ ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>

    <div class="archlens-content">
      ${formatArchLensContent(archLensHtml)}
    </div>

    <div class="archlens-footer">
      <p>🔍 <strong>Powered by ArchLens</strong> — Architecture Analysis & Code Quality Insights</p>
      <p style="margin-top: 0.5rem; opacity: 0.7;">Report generated by ArchLens SaaS Platform</p>
    </div>
  </div>

  <script>
    // Auto-detect system dark mode and apply
    function applyDarkMode() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
    applyDarkMode();

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyDarkMode();
    });
  </script>
</body>
</html>`;
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format ArchLens text content into structured HTML
function formatArchLensContent(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Health Score Section
    if (line.includes('Architecture Health Score') || line.includes('Health Score')) {
      const scoreMatch = line.match(/(\d+)\/(\d+)/);
      const gradeMatch = line.match(/\(([A-F])\)/);
      if (scoreMatch && gradeMatch) {
        const score = parseInt(scoreMatch[1]);
        const grade = gradeMatch[1];
        const colors: Record<string, string> = {
          'A': '#10b981', 'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'E': '#ef4444', 'F': '#dc2626'
        };
        html += `
          <div class="health-score-box">
            <h3>🏆 Saúde da Arquitetura</h3>
            <div class="health-score-value">${score}/100</div>
            <div class="health-score-status" style="color: ${colors[grade]}">Grade ${grade} - ${grade === 'A' || grade === 'B' ? '✅ Saudável' : grade === 'C' ? '⚠️ Atenção' : '❌ Crítico'}</div>
          </div>
        `;
      }
      i++;
      continue;
    }

    // Status
    if (line.includes('Status:')) {
      const status = line.replace('Status:', '').trim();
      html += `<p style="text-align: center; font-size: 1.1rem; color: #10b981; font-weight: 600;">✅ ${escapeHtml(status)}</p>`;
      i++;
      continue;
    }

    // Top Fan-in Section
    if (line.includes('Top Fan-in')) {
      html += '<div class="card"><h2>📥 Módulos Críticos (Fan-in Alto)</h2>';
      i++;
      const items: string[] = [];
      while (i < lines.length && !lines[i].match(/^(Top Fan-out|Coupling|Cycles|Project Classification|Framework|Violations|Recommended|Suggested|Architecture)/i)) {
        if (lines[i].includes('in |') || lines[i].match(/^\d+ in \|/)) {
          items.push(lines[i]);
        }
        i++;
      }
      if (items.length > 0) {
        html += '<div class="metrics-grid-list">';
        items.forEach(item => {
          const match = item.match(/(\d+) in \| (\d+) out \| (.+)/);
          if (match) {
            html += `
              <div class="metric-item">
                <div class="metric-header">${escapeHtml(match[3])}</div>
                <div class="metric-details">
                  <span class="metric-in">↓ ${match[1]} dependências</span>
                  <span class="metric-sep">•</span>
                  <span class="metric-out">↑ ${match[2]} saídas</span>
                </div>
              </div>
            `;
          }
        });
        html += '</div>';
      }
      html += '</div>';
      continue;
    }

    // Top Fan-out Section
    if (line.includes('Top Fan-out')) {
      html += '<div class="card"><h2>📤 Módulos Instáveis (Fan-out Alto)</h2>';
      i++;
      const items: string[] = [];
      while (i < lines.length && !lines[i].match(/^(Coupling|Cycles|Project Classification|Framework|Violations|Recommended|Suggested|Architecture)/i)) {
        if (lines[i].includes('in |') || lines[i].match(/^\d+ in \|/)) {
          items.push(lines[i]);
        }
        i++;
      }
      if (items.length > 0) {
        html += '<div class="metrics-grid-list">';
        items.forEach(item => {
          const match = item.match(/(\d+) in \| (\d+) out \| (.+)/);
          if (match) {
            html += `
              <div class="metric-item">
                <div class="metric-header">${escapeHtml(match[3])}</div>
                <div class="metric-details">
                  <span class="metric-in">↓ ${match[1]} dependências</span>
                  <span class="metric-sep">•</span>
                  <span class="metric-out">↑ ${match[2]} saídas</span>
                </div>
              </div>
            `;
          }
        });
        html += '</div>';
      }
      html += '</div>';
      continue;
    }

    // Coupling Hotspots
    if (line.includes('Coupling hotspots')) {
      html += '<div class="card"><h2>🔥 Pontos Críticos de Acoplamento</h2>';
      i++;
      const items: string[] = [];
      while (i < lines.length && !lines[i].match(/^(Cycles|Project Classification|Framework|Violations|Recommended|Suggested|Architecture)/i)) {
        if (lines[i].includes('in |') || lines[i].match(/^\d+ in \|/)) {
          items.push(lines[i]);
        }
        i++;
      }
      if (items.length > 0) {
        html += '<div class="metrics-grid-list">';
        items.forEach(item => {
          const match = item.match(/(\d+) in \| (\d+) out \| (.+)/);
          if (match) {
            html += `
              <div class="metric-item critical">
                <div class="metric-header">${escapeHtml(match[3])}</div>
                <div class="metric-details">
                  <span class="metric-in">↓ ${match[1]} dependências</span>
                  <span class="metric-sep">•</span>
                  <span class="metric-out">↑ ${match[2]} saídas</span>
                </div>
              </div>
            `;
          }
        });
        html += '</div>';
      }
      html += '</div>';
      continue;
    }

    // Cycles
    if (line.includes('Cycles detected')) {
      const cyclesMatch = line.match(/(\d+)/);
      const cycles = cyclesMatch ? parseInt(cyclesMatch[1]) : 0;
      const cycleStatus = cycles === 0 ? '✅ Nenhum ciclo' : `⚠️ ${cycles} ciclo(s) detectado(s)`;
      html += `
        <div class="info-box">
          <span class="info-icon">🔄</span>
          <span class="info-text"><strong>Ciclos:</strong> ${cycleStatus}</span>
        </div>
      `;
      i++;
      continue;
    }

    // Project Classification
    if (line.includes('Project Classification')) {
      html += '<div class="card"><h2>📋 Classificação do Projeto</h2>';
      i++;
      const classInfo: Record<string, string> = {};
      while (i < lines.length && !lines[i].match(/^(Framework|Violations|Recommended|Suggested|Architecture|$)/i)) {
        if (lines[i].includes(':')) {
          const [key, value] = lines[i].split(':').map(s => s.trim());
          if (key && value) {
            classInfo[key] = value;
          }
        }
        i++;
      }
      html += '<div class="classification-grid">';
      Object.entries(classInfo).forEach(([key, value]) => {
        let icon = '🏷️';
        if (key.toLowerCase().includes('framework')) icon = '🛠️';
        if (key.toLowerCase().includes('type')) icon = '📦';
        if (key.toLowerCase().includes('confidence')) icon = '📊';
        if (key.toLowerCase().includes('preset')) icon = '✨';
        html += `
          <div class="info-item">
            <div class="info-label">${icon} ${escapeHtml(key)}</div>
            <div class="info-value">${escapeHtml(value)}</div>
          </div>
        `;
      });
      html += '</div></div>';
      continue;
    }

    // Recommended Architecture
    if (line.includes('Recommended Architecture') || line.includes('Recommended preset')) {
      html += '<div class="card"><h2>🎯 Arquitetura Recomendada</h2>';
      i++;
      while (i < lines.length && !lines[i].match(/^(Architecture Rules|Violations|$)/i)) {
        if (lines[i].includes(':')) {
          const [key, value] = lines[i].split(':').map(s => s.trim());
          if (key && value && key.length < 50) {
            html += `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`;
          }
        } else if (lines[i].trim() && !lines[i].startsWith('archlens')) {
          html += `<p>${escapeHtml(lines[i])}</p>`;
        }
        i++;
      }
      html += '</div>';
      continue;
    }

    // Architecture Rules / Violations
    if (line.includes('Architecture Rules') || line.includes('Violations:')) {
      const violationsMatch = line.match(/(\d+)/);
      const violations = violationsMatch ? parseInt(violationsMatch[1]) : 0;
      html += `
        <div class="info-box" style="background: ${violations === 0 ? '#dcfce7' : '#fef2f2'}; border-left-color: ${violations === 0 ? '#10b981' : '#ef4444'};">
          <span class="info-icon">${violations === 0 ? '✅' : '⚠️'}</span>
          <span class="info-text"><strong>Violações de Regras:</strong> ${violations === 0 ? 'Nenhuma violação' : `${violations} violação(ões) encontrada(s)`}</span>
        </div>
      `;
      i++;
      continue;
    }

    // Skip lines that are already processed or empty
    i++;
  }

  return html;
}

export async function POST(req: Request) {
  let tempRepoPath: string | null = null;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project || !project.repoUrl) {
      return new Response(
        JSON.stringify({
          error: "Project not found or repository URL not configured",
        }),
        { status: 404 }
      );
    }

    // Create temporary directory
    const tempDirPrefix = `archlens-html-${projectId}-`;
    tempRepoPath = join(tmpdir(), tempDirPrefix + Date.now());

    console.log(`📁 Creating temp directory: ${tempRepoPath}`);

    // Clone repository
    await execAsync(`git clone "${project.repoUrl}" "${tempRepoPath}"`, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log(`✅ Repository cloned`);

    // Install dependencies (try npm first)
    try {
      const { stdout: checkFile } = await execAsync(
        `test -f "${join(tempRepoPath, "package.json")}" && echo "exists" || echo "missing"`,
        { timeout: 10000 }
      );

      if (checkFile.trim() === "exists") {
        try {
          await execAsync(`cd "${tempRepoPath}" && npm install --no-save`, {
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024,
          });
          console.log(`✅ Dependencies installed`);
        } catch {
          console.warn(`⚠️ npm install failed, continuing...`);
        }
      }
    } catch {
      console.warn(`⚠️ Dependency check failed, continuing...`);
    }

    // Run archlens with HTML output
    console.log(`🔍 Running ArchLens HTML analysis...`);
    
    const outputPath = join(tempRepoPath, "report.html");
    
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${tempRepoPath}" && npx archlens analyze . --format html --output "${outputPath}"`,
        { 
          timeout: 180000, 
          maxBuffer: 50 * 1024 * 1024, 
          shell: "/bin/bash" 
        }
      );
      
      console.log(`📝 ArchLens stdout:`, stdout.substring(0, 500));
      if (stderr) console.log(`📝 ArchLens stderr:`, stderr.substring(0, 500));
      console.log(`✅ HTML report generated at: ${outputPath}`);
    } catch (execError) {
      console.error(`❌ ArchLens execution failed:`, execError);
      throw execError;
    }

    // Read the HTML file
    const archLensHtml = await readFile(outputPath, "utf-8");

    // Extract body content from ArchLens HTML
    const bodyMatch = archLensHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1].trim() : archLensHtml;

    // Wrap with premium styling
    const styledHtml = wrapHtmlWithStyling(bodyContent, project.name || "Unknown Project");

    // Clean up temp directory
    if (tempRepoPath) {
      await rm(tempRepoPath, { recursive: true, force: true });
    }

    return new Response(styledHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating HTML report:", error);

    // Clean up temp directory
    if (tempRepoPath) {
      await rm(tempRepoPath, { recursive: true, force: true }).catch(
        console.error
      );
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate HTML report",
      }),
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve HTML report for a specific analysis
 * Usage: /api/analyses/html?id=<analysisId>
 */
export async function GET(req: Request) {
  let tempRepoPath: string | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("id");

    if (!analysisId) {
      return new Response(
        `<html><body><p>Error: analysisId required</p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        `<html><body><p>Error: Unauthorized</p></body></html>`,
        { status: 401, headers: { "Content-Type": "text/html" } }
      );
    }

    // Get analysis
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, analysisId));

    if (!analysis) {
      return new Response(
        `<html><body><p>Error: Analysis not found</p></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    // Verify user owns the analysis
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, analysis.projectId));

    if (!project || project.userId !== session.user.id) {
      return new Response(
        `<html><body><p>Error: Unauthorized</p></body></html>`,
        { status: 403, headers: { "Content-Type": "text/html" } }
      );
    }

    if (!project.repoUrl) {
      return new Response(
        `<html><body><p>Error: Repository URL not available</p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Create temporary directory
    const tempDirPrefix = `archlens-html-retrieve-${analysisId.slice(0, 8)}-`;
    tempRepoPath = join(tmpdir(), tempDirPrefix + Date.now());

    console.log(`📁 Creating temp directory: ${tempRepoPath}`);

    // Clone repository
    await execAsync(`git clone "${project.repoUrl}" "${tempRepoPath}"`, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Install dependencies (try npm first)
    try {
      const { stdout: checkFile } = await execAsync(
        `test -f "${join(tempRepoPath, "package.json")}" && echo "exists" || echo "missing"`,
        { timeout: 10000 }
      );

      if (checkFile.trim() === "exists") {
        try {
          await execAsync(`cd "${tempRepoPath}" && npm install --no-save`, {
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024,
          });
        } catch {
          console.warn(`⚠️ npm install failed, continuing...`);
        }
      }
    } catch {
      console.warn(`⚠️ Dependency check failed, continuing...`);
    }

    // Run archlens with HTML output
    console.log(`🔍 Running ArchLens HTML analysis in: ${tempRepoPath}`);
    const outputPath = join(tempRepoPath, "report.html");
    
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${tempRepoPath}" && npx archlens analyze . --format html --output "${outputPath}"`,
        { 
          timeout: 180000, 
          maxBuffer: 50 * 1024 * 1024, 
          shell: "/bin/bash" 
        }
      );
      
      console.log(`📝 ArchLens stdout:`, stdout.substring(0, 500));
      if (stderr) console.log(`📝 ArchLens stderr:`, stderr.substring(0, 500));
      console.log(`✅ HTML report generated at: ${outputPath}`);
    } catch (execError) {
      console.error(`❌ ArchLens execution failed:`, execError);
      throw execError;
    }

    // Read the HTML file
    const archLensHtml = await readFile(outputPath, "utf-8");

    // Extract body content from ArchLens HTML
    const bodyMatch = archLensHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1].trim() : archLensHtml;

    // Wrap with premium styling
    const styledHtml = wrapHtmlWithStyling(bodyContent, project.name || "Unknown Project");

    // Clean up temp directory
    if (tempRepoPath) {
      await rm(tempRepoPath, { recursive: true, force: true });
    }

    return new Response(styledHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error retrieving/generating HTML report:", error);

    // Clean up temp directory
    if (tempRepoPath) {
      await rm(tempRepoPath, { recursive: true, force: true }).catch(
        console.error
      );
    }

    const errorMsg = error instanceof Error ? error.message : "Internal error";
    return new Response(
      `<html><body><div style="padding: 20px;"><h1>Error</h1><p>${errorMsg}</p><hr><p><strong>Check server logs for details</strong></p></div></body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
