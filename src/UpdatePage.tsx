import React, { useState } from 'react';
import Airtable from 'airtable';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StablecoinRecord {
  id: string;
  fields: {
    Name: string;
    Symbol: string;
    'CoinLore ID'?: string;
    'CoinGecko ID'?: string;
  };
}

interface MarketData {
  market_cap_usd: string;
  volume24: string;
  source: 'coinlore' | 'coingecko';
}

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const COINLORE_BASE_URL = 'https://api.coinlore.net/api';

function UpdatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchCoinLoreData = async (coinIds: string[]) => {
    try {
      // Fetch in batches of 50
      const batches = [];
      for (let i = 0; i < coinIds.length; i += 50) {
        const batchIds = coinIds.slice(i, i + 50);
        batches.push(batchIds);
      }

      const newMarketData: Record<string, MarketData> = {};

      for (const batch of batches) {
        const response = await fetch(`${COINLORE_BASE_URL}/tickers/?id=${batch.join(',')}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.data) {
          data.data.forEach((coin: any) => {
            newMarketData[coin.id] = {
              market_cap_usd: coin.market_cap_usd,
              volume24: coin.volume24,
              source: 'coinlore'
            };
          });
        }
      }

      return newMarketData;
    } catch (error) {
      console.error('Error fetching CoinLore data:', error);
      return null;
    }
  };

  const fetchCoinGeckoData = async (coinIds: string[]) => {
    try {
      // Process in batches of 10
      const batches = [];
      for (let i = 0; i < coinIds.length; i += 10) {
        batches.push(coinIds.slice(i, i + 10));
      }

      const newMarketData: Record<string, MarketData> = {};

      for (const batch of batches) {
        const response = await fetch(
          `${COINGECKO_BASE_URL}/simple/price?ids=${batch.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        Object.entries(data).forEach(([id, details]: [string, any]) => {
          newMarketData[id] = {
            market_cap_usd: details.usd_market_cap?.toString() || '0',
            volume24: details.usd_24h_vol?.toString() || '0',
            source: 'coingecko'
          };
        });

        // Wait for 2 minutes between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 120000));
        }
      }

      return newMarketData;
    } catch (error) {
      console.error('Error fetching CoinGecko data:', error);
      return null;
    }
  };

  const updateMarketData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

      if (!apiKey || !baseId) {
        throw new Error('Missing Airtable credentials');
      }

      const airtable = new Airtable({ apiKey });
      const base = airtable.base(baseId);

      // First get all records
      const records = await new Promise<StablecoinRecord[]>((resolve, reject) => {
        base('Stablecoins').select({
          view: "Grid view"
        }).firstPage((err, records) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(records as StablecoinRecord[]);
        });
      });

      setProgress({ current: 0, total: records.length });

      // Get unique CoinLore and CoinGecko IDs
      const coinLoreIds = records
        .map(record => record.fields['CoinLore ID'])
        .filter((id): id is string => !!id);

      const coinGeckoIds = records
        .map(record => record.fields['CoinGecko ID'])
        .filter((id): id is string => !!id);

      let marketData: Record<string, MarketData> = {};

      // Fetch CoinLore data
      if (coinLoreIds.length > 0) {
        const coinLoreData = await fetchCoinLoreData(coinLoreIds);
        if (coinLoreData) {
          marketData = { ...marketData, ...coinLoreData };
        }
      }

      // Fetch CoinGecko data
      if (coinGeckoIds.length > 0) {
        const coinGeckoData = await fetchCoinGeckoData(coinGeckoIds);
        if (coinGeckoData) {
          marketData = { ...marketData, ...coinGeckoData };
        }
      }

      // Update each record in Airtable
      for (const [index, record] of records.entries()) {
        const coinLoreId = record.fields['CoinLore ID'];
        const coinGeckoId = record.fields['CoinGecko ID'];
        
        let data = null;
        if (coinLoreId && marketData[coinLoreId]) {
          data = marketData[coinLoreId];
        } else if (coinGeckoId && marketData[coinGeckoId]) {
          data = marketData[coinGeckoId];
        }

        if (data) {
          await base('Stablecoins').update(record.id, {
            'Market Cap': parseFloat(data.market_cap_usd) || 0,
            '24h Volume': parseFloat(data.volume24) || 0,
          });
        }

        setProgress(prev => ({ ...prev, current: index + 1 }));
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error updating market data:', error);
      setError(error instanceof Error ? error.message : 'Failed to update market data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Update Market Data</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-6">
            Click the button below to fetch the latest market data from CoinGecko and CoinLore
            and update the Airtable database. This process may take several minutes due to API
            rate limits.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Market data has been successfully updated!
            </div>
          )}

          {loading && progress.total > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Updating records...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={updateMarketData}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update Market Data'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default UpdatePage;