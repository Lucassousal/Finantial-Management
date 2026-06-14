const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add missing imports
if (!content.includes('HelpCircle')) {
  content = content.replace(
    'Settings\n} from \'lucide-react\'',
    'Settings,\n  HelpCircle,\n  X\n} from \'lucide-react\''
  );
} else if (!content.includes('  X\n} from')) {
  content = content.replace(
    '} from \'lucide-react\'',
    '  HelpCircle,\n  X\n} from \'lucide-react\''
  );
}

// 2. Add state for modal
if (!content.includes('const [helpModalType, setHelpModalType] = useState(null)')) {
  content = content.replace(
    'const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)) // \'YYYY-MM\'',
    'const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)) // \'YYYY-MM\'\n  const [helpModalType, setHelpModalType] = useState(null)'
  );
}

// 3. Add button for Saldo em Contas
if (!content.includes('onClick={() => setHelpModalType(\'saldo\')}')) {
  content = content.replace(
    '<CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Saldo em Contas</CardTitle>',
    `<CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    Saldo em Contas
                    <button 
                      onClick={() => setHelpModalType('saldo')}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer"
                      title="Como é calculado o Saldo em Contas?"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </CardTitle>`
  );
}

// 4. Add button for Patrimônio Líquido
if (!content.includes('onClick={() => setHelpModalType(\'patrimonio\')}')) {
  content = content.replace(
    '<CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Patrimônio Líquido</CardTitle>',
    `<CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    Patrimônio Líquido
                    <button 
                      onClick={() => setHelpModalType('patrimonio')}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer"
                      title="Como é calculado o Patrimônio Líquido?"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </CardTitle>`
  );
}

// 5. Add Modals
const modalsHTML = `
      {/* Modal de Ajuda - Cálculos */}
      {helpModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in-0">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-50">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="text-emerald-500 h-5 w-5" />
                {helpModalType === 'saldo' ? 'Como é calculado o Saldo?' : 'O que é Patrimônio Líquido?'}
              </h3>
              <button 
                onClick={() => setHelpModalType(null)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              {helpModalType === 'saldo' && (
                <>
                  <p>
                    O <strong>Saldo em Contas</strong> representa o dinheiro livre que você tem hoje na sua conta corrente/carteira.
                  </p>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md space-y-2 border border-zinc-100 dark:border-zinc-850">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Fórmula do Saldo</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <li>(+) Soma de todas as Receitas da história</li>
                      <li>(-) Soma de todas as Despesas da história</li>
                      <li>(-) Subtrai transferências para Investimentos</li>
                    </ul>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    <strong>Exemplo:</strong> Se você recebeu seu salário de R$ 5.000, pagou R$ 1.000 em contas e enviou R$ 500 para investir, seu Saldo em Contas será <strong>R$ 3.500</strong>.
                  </p>
                </>
              )}

              {helpModalType === 'patrimonio' && (
                <>
                  <p>
                    O <strong>Patrimônio Líquido</strong> responde à pergunta: <em>"Se eu resgatar tudo o que tenho investido e somar com o dinheiro da conta, qual é minha riqueza total?"</em>
                  </p>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md space-y-2 border border-zinc-100 dark:border-zinc-850">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Fórmula do Patrimônio</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <li>(+) Saldo em Contas (Dinheiro livre)</li>
                      <li>(+) Total Investido (Saldo atual rendendo nas corretoras)</li>
                    </ul>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    <strong>Exemplo:</strong> Se você tem R$ 3.500 no Saldo em Contas, mas aquele investimento de R$ 500 rendeu e agora está valendo R$ 550, o seu Patrimônio Líquido atual será <strong>R$ 4.050</strong>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('helpModalType &&')) {
  content = content.replace(
    '</Tabs>\n    </div>\n  )\n}\n',
    `</Tabs>\n\n${modalsHTML}\n    </div>\n  )\n}\n`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard updated with help modals successfully!');
