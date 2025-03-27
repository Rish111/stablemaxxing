import React, { useState, useEffect } from 'react';
import Airtable from 'airtable';
import { Search, ChevronDown, ChevronUp, ChevronRight, Loader2, Gift } from 'lucide-react';
import numeral from 'numeral';

interface StablecoinData {
  id: string;
  name: string;
  symbol: string;
  issuer: string;
  peggedTo: string;
  chains: string[];
  marketCap: number;
  volume24h: number;
  apy: number;
  rewards: string;
  iconUrl: string;
  buyLink: string;
}

interface RewardsButtonProps {
  rewards: string;
  className?: string;
  compact?: boolean;
}

type SortField = 'marketCap' | 'volume24h' | 'apy';
type SortDirection = 'asc' | 'desc';

const formatNumber = (value: number): string => {
  if (value >= 1e9) {
    return numeral(value / 1e9).format('0') + 'B';
  }
  if (value >= 1e6) {
    return numeral(value / 1e6).format('0') + 'M';
  }
  if (value >= 1e3) {
    return numeral(value / 1e3).format('0') + 'K';
  }
  return numeral(value).format('0');
};

const RewardsButton: React.FC<RewardsButtonProps> = ({ rewards, className = '', compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${
          rewards
            ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
        } ${className}`}
      >
        <Gift className="w-3.5 h-3.5" />
        {!compact && (
          <>
            See Rewards
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 right-0 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          {rewards ? (
            <div className="px-3 py-2 text-sm text-gray-700">{rewards}</div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 italic">No rewards at this time</div>
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const [stablecoins, setStablecoins] = useState<StablecoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
        const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

        if (!apiKey || !baseId) {
          throw new Error('Missing Airtable credentials');
        }

        const airtable = new Airtable({ apiKey });
        const base = airtable.base(baseId);
        
        const records = await new Promise<StablecoinData[]>((resolve, reject) => {
          const items: StablecoinData[] = [];
          
          base('Stablecoins')
            .select({
              view: "Grid view",
              sort: [{ field: 'Market Cap', direction: 'desc' }]
            })
            .eachPage(
              (records, fetchNextPage) => {
                records.forEach(record => {
                  const apy = record.get('APY');
                  items.push({
                    id: record.id,
                    name: record.get('Name') as string,
                    symbol: record.get('Symbol') as string,
                    issuer: record.get('Issuer') as string,
                    peggedTo: record.get('Pegged To') as string,
                    chains: (record.get('Chains') as string[] || []),
                    marketCap: record.get('Market Cap') as number || 0,
                    volume24h: record.get('24h Volume') as number || 0,
                    apy: apy ? parseFloat(apy as string) * 100 : 0,
                    rewards: record.get('Rewards') as string || '',
                    iconUrl: record.get('Icon URL') as string || '',
                    buyLink: record.get('Buy Link') as string || '',
                  });
                });
                fetchNextPage();
              },
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(items);
              }
            );
        });

        setStablecoins(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const sortedStablecoins = [...stablecoins]
    .filter(coin => 
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'desc' ? -1 : 1;
      return (a[sortField] - b[sortField]) * multiplier;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading stablecoins...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'desc' ? 
      <ChevronDown className="w-4 h-4 text-blue-600" /> : 
      <ChevronUp className="w-4 h-4 text-blue-600" />;
  };

  const MobileSortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
        sortField === field
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
      <SortIcon field={field} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center">
            <div>
              <div className="flex items-center gap-2">
                <img src="/favicon.svg" alt="Stablemaxxing" className="w-6 h-6" />
                <h1 className="text-xl font-semibold text-gray-900">Stablemaxxing</h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Giga gains with stables on chain</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stablecoins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Mobile Sort Bar */}
        <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
          <MobileSortButton field="marketCap" label="Market Cap" />
          <MobileSortButton field="volume24h" label="Volume" />
          <MobileSortButton field="apy" label="APY" />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-4 py-2 text-left">
                  <span className="text-xs font-medium text-gray-500 uppercase">Stablecoin</span>
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issuer</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pegged To</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chains</th>
                <th scope="col" className="px-4 py-2 text-right">
                  <button 
                    onClick={() => handleSort('marketCap')}
                    className="flex items-center gap-1 ml-auto text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    Market Cap
                    <SortIcon field="marketCap" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  <button 
                    onClick={() => handleSort('volume24h')}
                    className="flex items-center gap-1 ml-auto text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    24h Volume
                    <SortIcon field="volume24h" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  <button 
                    onClick={() => handleSort('apy')}
                    className="flex items-center gap-1 ml-auto text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    APY
                    <SortIcon field="apy" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedStablecoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0">
                        {coin.iconUrl ? (
                          <img src={coin.iconUrl} alt={coin.name} className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">{coin.symbol.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{coin.name}</div>
                        <div className="text-xs text-gray-500">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{coin.issuer}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {coin.peggedTo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {coin.peggedTo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {coin.chains.slice(0, 3).map((chain) => (
                        <span key={chain} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {chain}
                        </span>
                      ))}
                      {coin.chains.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{coin.chains.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">${formatNumber(coin.marketCap)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">${formatNumber(coin.volume24h)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {coin.apy > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {coin.apy.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <RewardsButton rewards={coin.rewards} />
                      {coin.buyLink ? (
                        <a
                          href={coin.buyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Buy
                        </a>
                      ) : (
                        <button disabled className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed">
                          Buy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {sortedStablecoins.map((coin) => (
            <div 
              key={coin.id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {coin.iconUrl ? (
                        <img src={coin.iconUrl} alt={coin.name} className="h-10 w-10 rounded-full" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">{coin.symbol.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{coin.name}</div>
                      <div className="text-sm text-gray-500">{coin.symbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RewardsButton rewards={coin.rewards} compact />
                    {coin.buyLink ? (
                      <a
                        href={coin.buyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600"
                      >
                        Buy
                      </a>
                    ) : (
                      <button 
                        disabled 
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-400 bg-gray-100"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Pegged To</div>
                    <div className="mt-1">
                      <span className="text-sm font-medium">{coin.peggedTo || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Market Cap</div>
                    <div className="mt-1">
                      <span className="text-sm font-medium">${formatNumber(coin.marketCap)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">APY</div>
                    <div className="mt-1">
                      {coin.apy > 0 ? (
                        <span className="text-sm font-medium text-green-600">{coin.apy.toFixed(2)}%</span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleCard(coin.id)}
                  className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {expandedCard === coin.id ? (
                    <>
                      Show less
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Show more
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {expandedCard === coin.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Issuer</div>
                      <div className="mt-1 text-sm text-gray-900">{coin.issuer}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">24h Volume</div>
                      <div className="mt-1 text-sm text-gray-900">${formatNumber(coin.volume24h)}</div>
                    </div>
                    {coin.chains.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Available on</div>
                        <div className="flex flex-wrap gap-1">
                          {coin.chains.map((chain) => (
                            <span
                              key={chain}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {chain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {coin.rewards && (
                      <div>
                        <div className="text-xs text-gray-500">Rewards</div>
                        <div className="mt-1 text-sm text-gray-900">{coin.rewards}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;