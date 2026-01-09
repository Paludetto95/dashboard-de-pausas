require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Carrega handler .mjs apenas sob demanda para evitar erro de import ESM em CommonJS
let handler = null;
async function getArgusHandler(){
  if(handler) return handler;
  const mod = await import('./api/dados-argus.mjs');
  handler = mod.default;
  return handler;
}
const geminiKeyHandler = require('./api/gemini-key.js');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000; // Porta configurável via env

// Middleware para permitir que o painel (rodando em outra porta/origem) se comunique com este proxy
app.use(cors());
// Middleware para entender o corpo das requisições como JSON (mantido para outros endpoints)
app.use(express.json());

// Add debugging middleware
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

// O endpoint que o seu painel vai chamar, agora suportando GET
app.get('/api/dados-argus', async (req, res) => {
    console.log('[Proxy] Requisição GET recebida para /api/dados-argus');
    console.log('[Proxy] Query params:', req.query);
    const hasGlobal = !!(process.env.ARGUS_API_TOKEN_GLOBAL && String(process.env.ARGUS_API_TOKEN_GLOBAL).trim());
    const hasCampaignEnv = !!process.env.ARGUS_CAMPAIGN_TOKENS;
    console.log('[Proxy] Env presence before handler:', { hasGlobalToken: hasGlobal, hasCampaignTokensEnv: hasCampaignEnv });
    console.log('[Proxy] ARGUS_API_TOKEN_GLOBAL exists:', !!process.env.ARGUS_API_TOKEN_GLOBAL);
    console.log('[Proxy] ARGUS_API_URL:', process.env.ARGUS_API_URL);
    try {
        console.log('[Proxy] Getting Argus handler...');
        const h = await getArgusHandler();
        console.log('[Proxy] Handler obtained, calling...');
        await h(req, res);
        console.log('[Proxy] Handler completed successfully');
    } catch (error) {
        console.error('[Proxy] Erro ao processar requisição da API Argus:', error);
        console.error('[Proxy] Error stack:', error.stack);
        res.status(500).json({ message: 'Erro interno no servidor proxy ao processar a requisição da API Argus.' });
    }
});

// Adiciona suporte para POST requests também
app.post('/api/dados-argus', async (req, res) => {
    console.log('[Proxy] Requisição POST recebida para /api/dados-argus');
    console.log('[Proxy] Body:', req.body);
    const hasGlobal = !!(process.env.ARGUS_API_TOKEN_GLOBAL && String(process.env.ARGUS_API_TOKEN_GLOBAL).trim());
    const hasCampaignEnv = !!process.env.ARGUS_CAMPAIGN_TOKENS;
    console.log('[Proxy] Env presence before handler:', { hasGlobalToken: hasGlobal, hasCampaignTokensEnv: hasCampaignEnv });
    console.log('[Proxy] ARGUS_API_TOKEN_GLOBAL exists:', !!process.env.ARGUS_API_TOKEN_GLOBAL);
    console.log('[Proxy] ARGUS_API_URL:', process.env.ARGUS_API_URL);
    try {
        console.log('[Proxy] Getting Argus handler...');
        const h = await getArgusHandler();
        console.log('[Proxy] Handler obtained, calling...');
        await h(req, res);
        console.log('[Proxy] Handler completed successfully');
    } catch (error) {
        console.error('[Proxy] Erro ao processar requisição da API Argus:', error);
        console.error('[Proxy] Error stack:', error.stack);
        res.status(500).json({ message: 'Erro interno no servidor proxy ao processar a requisição da API Argus.' });
    }
});

// Serve arquivos estáticos APÓS as rotas da API
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dash.html');
});

// Endpoint simples para checar envs
app.get('/api/env-check', (req, res) => {
  res.json({
    hasGlobalToken: !!(process.env.ARGUS_API_TOKEN_GLOBAL && String(process.env.ARGUS_API_TOKEN_GLOBAL).trim()),
    hasCampaignTokensEnv: !!process.env.ARGUS_CAMPAIGN_TOKENS,
    campaignTokensKeys: (() => { try { return Object.keys(JSON.parse(process.env.ARGUS_CAMPAIGN_TOKENS || '{}')); } catch { return []; } })()
  });
});


app.post('/export-html', (req, res) => {
    const data = req.body;

    // Simple validation
    if (!Array.isArray(data)) {
        return res.status(400).send('Invalid data format. Expected an array.');
    }

    const tableHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Exportação de Dados de Pausa</title>
            <link href="https://unpkg.com/tabulator-tables@5.5.2/dist/css/tabulator_bootstrap5.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { font-family: sans-serif; margin: 20px; background-color: #f4f4f9; }
                h1 { color: #333; }
                #export-table { background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body data-bs-theme="dark">
            <h1>Relatório de Pausas</h1>
            <p>Dados exportados em: ${new Date().toLocaleString('pt-BR')}</p>
            <div id="export-table"></div>

            <script type="text/javascript" src="https://unpkg.com/tabulator-tables@5.5.2/dist/js/tabulator.min.js"><\/script>
            <script>
                // Data embedded from server
                const tableData = ${JSON.stringify(data, null, 2)};

                // Functions needed for formatting, extracted from dash.html
                function formatDateTimeDisplay(dateStr) {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    return date.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                }

                function formatMinutesToHHMMSS(totalMinutes) {
                    if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00:00';
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = Math.floor(totalMinutes % 60);
                    const seconds = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
                    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                }

                // Initialize Tabulator
                new Tabulator("#export-table", {
                    data: tableData,
                    layout: "fitColumns",
                    placeholder: "Nenhum dado encontrado.",
                    columns: [
                        { title: "Consultor", field: "CONSULTOR" },
                        { title: "Tipo de Pausa", field: "TIPO" },
                        { title: "Data Início", field: "DATA_INICIO_OBJ", hozAlign: "center", formatter: (cell) => formatDateTimeDisplay(cell.getValue()) },
                        { title: "Duração (HH:MM:SS)", field: "DURACAO_MINUTES", hozAlign: "center", formatter: (cell) => formatMinutesToHHMMSS(cell.getValue()) },
                        { title: "Duração (Min)", field: "DURACAO_MINUTES", hozAlign: "right", formatter: (c) => c.getValue().toFixed(1) },
                    ],
                });
            <\/script>
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_pausas.html"');
    res.send(tableHtml);
});

app.listen(PORT, () => {
    console.log(`Servidor Proxy rodando em http://localhost:${PORT}`);
    console.log('Seu painel HTML agora deve fazer requisições para este endereço.');
    console.log(`Servindo arquivos estáticos de: ${__dirname}`);
});

// Endpoint para obter a chave da API Gemini
app.options('/api/gemini-key', geminiKeyHandler);
app.get('/api/gemini-key', geminiKeyHandler);

// Endpoint para gerar análise via Gemini no backend (evita bloqueios no navegador)
app.post('/api/generate-ai', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }
    let prompt = (req.body && req.body.prompt) ? String(req.body.prompt) : '';
    const general = req.body && (req.body.general === true || req.body.general === 'true');
    const mock = req.body && (req.body.mock === true || req.body.mock === 'true');
    const timeframe = req.body && req.body.ultimosMinutos ? Number(req.body.ultimosMinutos) : 1440;

    // Variáveis para armazenar dados agregados (usadas em fallback também)
    let total = 0, avg = 0, median = 0, p75 = 0, p95 = 0;
    let byType = {}, byConsultant = {}, consultantsSorted = [];

    // Se solicitado uma análise geral, busca os dados internamente e monta um prompt automático
    if (!prompt && (general || mock)) {
      try {
        let rows = [];
        
        if (mock) {
          // Gera dados simulados
          const consultants = ['Ana Silva', 'Bruno Costa', 'Carlos Santos', 'Diana Lima', 'Elena Rocha', 'Felipe Gomes', 'Gabriela Martins', 'Henrique Oliveira'];
          const types = ['Administrativa', 'Formação', 'Operacional', 'Espera', 'Suporte Técnico'];
          rows = [];
          for (let i = 0; i < 120; i++) {
            rows.push({
              CONSULTOR: consultants[Math.floor(Math.random() * consultants.length)],
              TIPO: types[Math.floor(Math.random() * types.length)],
              DURACAO_MINUTES: 2 + Math.random() * 25 // 2 a 27 minutos
            });
          }
        } else {
          // Busca dados reais da API Argus
          const url = `http://localhost:${PORT}/api/dados-argus`;
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ultimosMinutos: timeframe })
          });
          const bodyText = await resp.text();
          let payload = null;
          try { payload = JSON.parse(bodyText); } catch { payload = null; }
          if (!resp.ok || !payload || !payload.pausasDetalhadas) {
            return res.status(502).json({ error: 'Falha ao obter dados para análise geral.', details: payload || bodyText });
          }
          rows = payload.pausasDetalhadas;
        }

        total = rows.length;
        const durations = rows.map(r => Number(r.DURACAO_MINUTES || r.duracao_minutos || 0)).filter(n => !isNaN(n));
        const sum = durations.reduce((a,b) => a+b, 0);
        avg = durations.length ? (sum / durations.length) : 0;

        // Calcula mediana e percentis simples (p75, p95)
        if (durations.length) {
          const sorted = durations.slice().sort((a,b)=>a-b);
          const n = sorted.length;
          if (n % 2 === 1) median = sorted[(n-1)/2]; else median = (sorted[n/2 - 1] + sorted[n/2]) / 2;
          const percentile = (arr, p) => {
            if (!arr.length) return 0;
            const idx = Math.ceil((p/100) * arr.length) - 1;
            return arr[Math.max(0, Math.min(arr.length-1, idx))];
          };
          p75 = percentile(sorted, 75);
          p95 = percentile(sorted, 95);
        }

        byType = {};
        byConsultant = {};
        for (const r of rows) {
          const tipo = (r.TIPO || r.tipo || 'Desconhecido');
          byType[tipo] = (byType[tipo]||0) + 1;
          const consul = (r.CONSULTOR || r.consultor || 'SemNome');
          byConsultant[consul] = byConsultant[consul] || { count: 0, totalDuration: 0 };
          const d = Number(r.DURACAO_MINUTES || r.duracao_minutos || 0) || 0;
          byConsultant[consul].count += 1;
          byConsultant[consul].totalDuration += d;
        }

        const typeLines = Object.entries(byType).map(([k,v]) => `- ${k}: ${v} (${((v/total)*100).toFixed(1)}%)`).join('\n');
        consultantsSorted = Object.entries(byConsultant).map(([k,v]) => ({ name:k, count:v.count, avg: v.count ? v.totalDuration / v.count : 0 })).sort((a,b)=>b.count-a.count).slice(0,5);
        const consultantLines = consultantsSorted.map(c => `- ${c.name}: ${c.count} pausas, duração média ${c.avg.toFixed(1)} min`).join('\n');

        prompt = `Analise geral de desempenho da equipe com base nos últimos ${timeframe} minutos (agregados):\nTotal de registros de pausa: ${total}\nDuração média das pausas (min): ${avg.toFixed(1)}\nDuração mediana (min): ${median.toFixed(1)}\nPercentil 75 (min): ${p75.toFixed(1)}\nPercentil 95 (min): ${p95.toFixed(1)}\nDistribuição por tipo:\n${typeLines}\nTop consultores por número de pausas:\n${consultantLines}\n\nPor favor produza:\n1) Resumo executivo em 3 linhas\n2) Principais insights (3-6 bullets)\n3) Recomendações práticas para reduzir pausas improdutivas e melhorar desempenho\n4) Métricas para monitorar nas próximas semanas\nUse linguagem objetiva, em português, e evite explicações técnicas desnecessárias.`;
      } catch (err) {
        console.error('[Proxy] Erro ao montar análise geral:', err);
        return res.status(500).json({ error: 'Erro ao montar análise geral.' });
      }
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Campo "prompt" é obrigatório quando não for solicitada análise geral.' });
    }

    const apiVersionsToTry = ['v1beta2', 'v1'];
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let aiText = '';
    let lastError = null;
    outerLoop:
    for (const apiVersion of apiVersionsToTry) {
      for (const model of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
          console.log(`[AI] Tentando ${model} com versão ${apiVersion}`);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const respText = await response.text();
          if (!response.ok) {
            let errorJson = {};
            try { errorJson = JSON.parse(respText); } catch {}
            const msg = errorJson.error?.message || `Erro API IA (${model}, ${apiVersion}): ${response.status}`;
            console.log(`[AI] Erro com ${model}: ${msg}`);
            throw new Error(msg);
          }
          let dataObj = null;
          try { dataObj = JSON.parse(respText); } catch {
            throw new Error(`Resposta não-JSON do modelo (${model}).`);
          }
          aiText = dataObj.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (aiText) {
            console.log(`[AI] Sucesso com modelo ${model}`);
            break outerLoop;
          } else {
            lastError = new Error('Resposta da IA vazia ou malformada.');
          }
        } catch (err) {
          lastError = err;
        }
      }
    }

    if (!aiText) {
      console.log('[AI] Gerando análise estruturada local (fallback elaborado)');
      // Fallback: gera análise ELABORADA localmente quando Gemini falhar
      const insights = [];
      const recommendations = [];
      const metrics = [];
      const alerts = [];

      // ====== ANÁLISE 1: KPIs e Scores ======
      const scoreQuality = Math.max(0, 100 - Math.abs(avg - 10) * 5); // meta 10 min
      const scoreVariability = Math.max(0, 100 - ((p95 - p75) / median) * 50);
      const scoreDistribution = Object.keys(byType).length >= 3 ? 85 : 60;
      const overallScore = (scoreQuality + scoreVariability + scoreDistribution) / 3;

      metrics.push(`📊 SCORE DE DESEMPENHO: ${overallScore.toFixed(0)}/100`);
      metrics.push(`   ├─ Qualidade de pausa: ${scoreQuality.toFixed(0)}/100 (duração)`);
      metrics.push(`   ├─ Variabilidade: ${scoreVariability.toFixed(0)}/100 (consistência)`);
      metrics.push(`   └─ Diversidade: ${scoreDistribution.toFixed(0)}/100 (tipos)`);

      // ====== ANÁLISE 2: Métricas Descritivas Avançadas ======
      metrics.push(`\n⏱️ DURAÇÃO (minutos):`);
      metrics.push(`   ├─ Mínimo: ${Math.min(...(Object.values(byConsultant).map(c => c.totalDuration / c.count) || [0])).toFixed(1)}`);
      metrics.push(`   ├─ Média: ${avg.toFixed(1)} (meta: <12)`);
      metrics.push(`   ├─ Mediana: ${median.toFixed(1)}`);
      metrics.push(`   ├─ P75: ${p75.toFixed(1)}`);
      metrics.push(`   └─ Máximo (P95): ${p95.toFixed(1)}`);
      
      const range = p95 - (Math.min(...(Object.values(byConsultant).map(c => c.totalDuration / c.count) || [0])));
      metrics.push(`   Amplitude: ${range.toFixed(1)} min | Coeficiente de variação: ${((Math.sqrt(p95 - median) / avg) * 100).toFixed(1)}%`);

      // ====== ANÁLISE 3: Outliers e Alertas ======
      const outlierThreshold = median + 1.5 * (p75 - median);
      let outlierCount = 0;
      const totalMinutesWasted = [];
      for (const c of Object.values(byConsultant)) {
        if (c.totalDuration / c.count > outlierThreshold) outlierCount++;
      }
      
      if (avg > 15) {
        alerts.push(`🚨 ALERTA: Duração média (${avg.toFixed(1)} min) ACIMA da meta (12 min)`);
      }
      if (p95 > 30) {
        alerts.push(`🚨 ALERTA: ${((p95 - median) / median * 100).toFixed(0)}% de dispersão entre P75 e P95 — possíveis pausas indevidas`);
      }
      if (outlierCount > Object.keys(byConsultant).length * 0.2) {
        alerts.push(`⚠️ ATENÇÃO: ${outlierCount}/${Object.keys(byConsultant).length} consultores acima do padrão`);
      }

      // ====== ANÁLISE 4: Distribuição por Tipo de Pausa ======
      metrics.push(`\n📋 DISTRIBUIÇÃO POR TIPO:`);
      const typeAnalysis = Object.entries(byType)
        .map(([tipo, count]) => {
          const pct = (count / total * 100).toFixed(1);
          const bar = '█'.repeat(Math.ceil(count / 5)) + '░'.repeat(Math.max(0, 20 - Math.ceil(count / 5)));
          return { tipo, count, pct, bar };
        })
        .sort((a, b) => b.count - a.count);

      for (const t of typeAnalysis) {
        metrics.push(`   ${t.tipo.padEnd(20)}: ${t.bar} ${t.count} (${t.pct}%)`);
      }

      // ====== ANÁLISE 5: Top Consultores (com mais detalhes) ======
      metrics.push(`\n👥 TOP 5 CONSULTORES (por volume):`);
      for (let i = 0; i < Math.min(5, consultantsSorted.length); i++) {
        const c = consultantsSorted[i];
        const pct = (c.count / total * 100).toFixed(1);
        const flag = c.avg > avg * 1.5 ? '🔴' : c.avg > avg * 1.2 ? '🟡' : '🟢';
        metrics.push(`   ${i+1}. ${flag} ${c.name.padEnd(20)} → ${c.count} pausas | Avg: ${c.avg.toFixed(1)} min | Total: ${(c.count * c.avg).toFixed(0)} min (${pct}%)`);
      }

      // ====== ANÁLISE 6: Insights Detalhados ======
      insights.push(`Sua equipe registrou ${total} pausas em ${timeframe} minutos, totalizando ${(total * avg).toFixed(0)} minutos improdutivos (${((total * avg / timeframe) * 100).toFixed(1)}% do período).`);
      
      if (avg > 15) {
        insights.push(`A duração média (${avg.toFixed(1)} min) está 25-50% acima do benchmark recomendado (10-12 min). Prioritário: revisar procedimentos e treinar consultores.`);
      } else if (avg < 8) {
        insights.push(`Pausa curtas e eficientes (${avg.toFixed(1)} min) — controle operacional está bom. Manter vigilância para evitar micro-interrupções.`);
      } else {
        insights.push(`Pausa dentro da faixa esperada (${avg.toFixed(1)} min). Oportunidade de otimizar outliers acima do P95.`);
      }

      const topType = typeAnalysis[0];
      insights.push(`"${topType.tipo}" representa ${topType.pct}% das pausas (${topType.count} registros). ${topType.count > total * 0.3 ? 'Concentração alta — analisar raiz.' : 'Distribuição equilibrada entre tipos.'}`);

      if (consultantsSorted.length > 0) {
        const best = consultantsSorted[consultantsSorted.length - 1];
        const worst = consultantsSorted[0];
        const diff = ((worst.avg - best.avg) / best.avg * 100).toFixed(0);
        insights.push(`Variação entre consultores: ${worst.name} (${worst.avg.toFixed(1)} min/pausa) vs ${best.name} (${best.avg.toFixed(1)} min/pausa) — ${diff}% de diferença sugere gaps de treinamento.`);
      }

      // ====== ANÁLISE 7: Recomendações Estratégicas ======
      recommendations.push(`Implementar SLA: Máximo ${Math.ceil(avg)}–12 minutos por pausa, com alertas acima de ${p75.toFixed(0)} min`);
      recommendations.push(`Treinar top 3 consultores com duração acima da média (coaching individual 1:1 de 30 min/semana)`);
      recommendations.push(`Revisar procedimentos para tipo "${topType.tipo}" — padronizar etapas e criar checklist`);
      
      if (p95 - median > 15) {
        recommendations.push(`Investigar outliers: ${((p95 - median) / median * 100).toFixed(0)}% de variação entre P75 e P95. Possíveis causas: sistema lento, falta de recurso ou falta de autoridade.`);
      }
      
      recommendations.push(`Criar dashboard com limite visual (semáforo: verde <${Math.ceil(avg)-2} min, amarelo ${Math.ceil(avg)-2}-${Math.ceil(avg)} min, vermelho >${Math.ceil(avg)} min)`);
      recommendations.push(`Revisar a cada segunda-feira: top 3 violadores da semana anterior com gestor direto`);
      recommendations.push(`Testar automação: identifi pausas recorrentes que podem ser otimizadas por scripts/integração de sistemas`);

      // ====== RECOMENDAÇÕES ADICIONAIS ======
      if (overallScore < 70) {
        recommendations.push(`🔴 PRIORIDADE: Score ${overallScore.toFixed(0)}/100 — Reunião estratégica com líderes necessária para reverter tendência`);
      }

      // ====== METAS SUGERIDAS ======
      metrics.push(`\n🎯 METAS SUGERIDAS (próximas 4 semanas):`);
      metrics.push(`   Semana 1-2: Reduzir média para ${(avg * 0.9).toFixed(1)} min (-10%)`);
      metrics.push(`   Semana 3-4: Reduzir P95 para ${(p95 * 0.8).toFixed(1)} min (-20% outliers)`);
      metrics.push(`   Mês 2: Atingir score ≥75/100 com implementação de SLA`);

      aiText = `╔════════════════════════════════════════════════════════════════╗
║         ANÁLISE GERAL DE DESEMPENHO — RELATÓRIO EXECUTIVO       ║
╚════════════════════════════════════════════════════════════════╝

🎯 RESUMO EXECUTIVO
${insights.map(i => `• ${i}`).join('\n')}

${alerts.length > 0 ? `\n⚠️ ALERTAS CRÍTICOS\n${alerts.map(a => `• ${a}`).join('\n')}\n` : ''}

📊 MÉTRICAS E INDICADORES
${metrics.join('\n')}

💡 RECOMENDAÇÕES ESTRATÉGICAS (Prioridade)
${recommendations.map((r, idx) => `${idx+1}. ${r}`).join('\n')}

📅 PRÓXIMOS PASSOS
1. Compartilhar este relatório com líderes de equipe
2. Identificar 1-2 consultores para programa piloto de otimização
3. Implementar SLA de pausa no próximo sprint
4. Revisar tecnologia/sistemas que causam pausas prolongadas
5. Agendar reunião de acompanhamento para daqui 1 semana

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Gerado em: ${new Date().toLocaleString('pt-BR')} | Versão: 2.0 (Análise Estruturada)
`;
    }
    return res.status(200).json({ text: aiText });
  } catch (error) {
    console.error('[Proxy] Erro em /api/generate-ai:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar análise.' });
  }
});