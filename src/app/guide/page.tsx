export default function GuidePage() {
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }
  const thStyle: React.CSSProperties = { background: 'var(--bg3)', padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--text3)' }
  const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
      <Section title="生活安全レベル（判断基準）"
        desc="家計の健全度を5段階で評価します。複数の指標を総合して判定されます。">
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>レベル</th><th style={thStyle}>条件</th><th style={thStyle}>状態</th></tr></thead>
          <tbody>
            {[
              ['🏆 S', '貯蓄率≥30%、固定費率≤40%、防衛資金達成', '完全安全圏。資産形成加速期'],
              ['✅ A', '貯蓄率≥20%、固定費率≤50%', '安定状態。余裕資金で投資検討可'],
              ['📘 B', '貯蓄率≥10%、固定費率≤60%', '標準的。改善余地あり'],
              ['⚠️ C', '貯蓄率≥0%、固定費率≤70%', '要注意。支出見直し推奨'],
              ['🚨 D', '貯蓄率<0% or 固定費率>70%', '危険水域。即時改善必要'],
            ].map(([level, cond, state]) => (
              <tr key={level}><td style={tdStyle}>{level}</td><td style={tdStyle}>{cond}</td><td style={tdStyle}>{state}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="各指標の定義">
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>指標</th><th style={thStyle}>計算式</th><th style={thStyle}>理想値</th></tr></thead>
          <tbody>
            {[
              ['貯蓄率', '貯金÷収入×100', '20%以上'],
              ['固定費率', '固定費÷収入×100', '40%以下'],
              ['浪費率', '娯楽費÷支出×100', '15%以下'],
              ['節約率', '（予算-実績）÷予算×100', '0%以上'],
              ['先取り貯金達成度', '実際の先取り貯金÷目標×100', '100%'],
              ['防衛資金達成度', '累計貯金÷（月支出×防衛月数）×100', '100%'],
              ['受動収入率', '受動収入÷支出×100', '10%以上で優秀'],
              ['収支安定性', '過去3ヶ月の収支の標準偏差', '低いほど安定'],
            ].map(([k, f, i]) => (
              <tr key={k}><td style={tdStyle}>{k}</td><td style={tdStyle}>{f}</td><td style={tdStyle}>{i}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="配分プリセット解説">
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>プリセット</th><th style={thStyle}>貯金</th><th style={thStyle}>支出</th><th style={thStyle}>投資</th><th style={thStyle}>向いている人</th></tr></thead>
          <tbody>
            {[
              ['標準', '20%', '70%', '10%', '安定収入・バランス重視'],
              ['貯金重視', '40%', '50%', '10%', '目標額がある・住宅購入準備'],
              ['節約', '30%', '65%', '5%', '収入が不安定・緊急時'],
              ['FIRE・投資重視', '10%', '60%', '30%', 'FIRE志向・高収入層'],
              ['今を楽しむ', '15%', '80%', '5%', '若手・習慣づけ重視'],
            ].map(row => (
              <tr key={row[0]}>{row.map((c, i) => <td key={i} style={tdStyle}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="カテゴリ支出割合の目安">
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>カテゴリ</th><th style={thStyle}>推奨割合（支出に占める）</th><th style={thStyle}>注意</th></tr></thead>
          <tbody>
            {[
              ['住居費', '25〜30%', '収入の30%を超えると要注意'],
              ['食費', '15〜20%', '外食含む'],
              ['水道費', '1〜2%', '2ヶ月分請求あり'],
              ['電気代', '2〜4%', '季節変動大'],
              ['ガス代', '1〜3%', '冬は高め'],
              ['通信費', '3〜5%', '格安SIM推奨'],
              ['娯楽', '10〜15%', '浪費率に影響'],
              ['医療・健康', '3〜5%', '予防投資として重要'],
            ].map(([k, r, n]) => (
              <tr key={k}><td style={tdStyle}>{k}</td><td style={tdStyle}>{r}</td><td style={tdStyle}>{n}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--accent)' }}>{title}</div>
      {desc && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 8 }}>{desc}</div>}
      {children}
    </div>
  )
}
