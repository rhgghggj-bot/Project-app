export default function Groupe() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-purple-700 px-5 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Entrepreneurs Paris 10e</span>
        <span className="text-purple-300 text-sm">8 membres</span>
      </nav>

      <div className="px-5 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">TK</div>
            <span className="text-xs text-gray-400">Thomas</span>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">SL</div>
            <span className="text-xs text-gray-400">Sara</span>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-medium">ML</div>
            <span className="text-xs text-gray-400">Marc</span>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium">JD</div>
            <span className="text-xs text-gray-400">Julie</span>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">PR</div>
            <span className="text-xs text-gray-400">Pierre</span>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-12">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">+</div>
            <span className="text-xs text-gray-400">Inviter</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Projets partagés</p>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="p-4 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">TK</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Thomas K.</p>
                <p className="text-xs text-gray-400">il y a 3 jours</p>
              </div>
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">restauration</span>
          </div>
          <div className="bg-yellow-100 h-28 flex items-center justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-1">Restaurant le Coin</h2>
            <p className="text-sm text-gray-500 mb-3">Je lance un restaurant de cuisine fusion dans le 10e. Je cherche des soutiens !</p>
            <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">QR</div>
              <div>
                <p className="text-sm font-medium text-purple-900">Soutenir via Revolut</p>
                <p className="text-xs text-purple-600 mt-1">revolut.me/thomask</p>
              </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <button className="text-sm text-gray-400">14 likes</button>
              <button className="text-sm text-gray-400">5 comm.</button>
              <button className="text-sm text-gray-400">Partager</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="p-4 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">SL</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sara L.</p>
                <p className="text-xs text-gray-400">il y a 5 jours</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">commerce</span>
          </div>
          <div className="bg-green-100 h-28 flex items-center justify-center text-4xl">🌱</div>
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-1">Épicerie bio locale</h2>
            <p className="text-sm text-gray-500 mb-3">Circuit court, zéro plastique. On cherche un local d'environ 80m². Des contacts ?</p>
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <button className="text-sm text-gray-400">28 likes</button>
              <button className="text-sm text-gray-400">9 comm.</button>
              <button className="text-sm text-gray-400">↗️ Partager</button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
