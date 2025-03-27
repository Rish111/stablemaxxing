import { writeFileSync } from 'node:fs';

interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  market_data?: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
  };
}

const API_KEY = 'CG-sXzfvWgucK4o83eHExyceuDm';
const BASE_URL = 'https://api.coingecko.com/api/v3';

const stablecoins = [
  { symbol: 'USDT', names: ['Tether USD', 'Tether'] },
  { symbol: 'USDC', names: ['USD Coin'] },
  { symbol: 'USDe', names: ['Ethena USDe'] },
  { symbol: 'DAI', names: ['Dai'] },
  { symbol: 'FDUSD', names: ['First Digital USD'] },
  { symbol: 'PYUSD', names: ['PayPal USD'] },
  { symbol: 'TUSD', names: ['TrueUSD'] },
  { symbol: 'USD0', names: ['Usual USD'] },
  { symbol: 'USDY', names: ['Ondo US Dollar Yield'] },
  { symbol: 'FRAX', names: ['Frax'] },
  { symbol: 'USDD', names: ['USDD'] },
  { symbol: 'RLUSD', names: ['Ripple USD'] },
  { symbol: 'USDG', names: ['Global Dollar'] },
  { symbol: 'EURC', names: ['EURC'] },
  { symbol: 'EURS', names: ['STASIS EURO'] },
  { symbol: 'USDf', names: ['Falcon USD'] },
  { symbol: 'USDB', names: ['USDB'] },
  { symbol: 'USDP', names: ['Pax Dollar'] },
  { symbol: 'USTC', names: ['TerraClassicUSD'] },
  { symbol: 'USDX', names: ['USDX [Kava]'] },
  { symbol: 'lisUSD', names: ['lisUSD'] },
  { symbol: 'vBUSD', names: ['Venus BUSD'] },
  { symbol: 'BUSD', names: ['BUSD', 'Binance USD'] },
  { symbol: 'AEUR', names: ['Anchored Coins AEUR'] },
  { symbol: 'USDL', names: ['Lift Dollar'] },
  { symbol: 'GUSD', names: ['Gemini Dollar'] },
  { symbol: 'LUSD', names: ['Liquity USD'] },
  { symbol: 'EURCV', names: ['EUR CoinVertible'] },
  { symbol: 'EURt', names: ['Tether EURt'] },
  { symbol: 'EURI', names: ['Eurite'] },
  { symbol: 'CUSD', names: ['Celo Dollar'] },
  { symbol: 'XUSD', names: ['StraitsX USD'] },
  { symbol: 'SUSD', names: ['sUSD'] },
  { symbol: 'RSV', names: ['Reserve Dollar'] },
  { symbol: 'XSGD', names: ['XSGD'] },
  { symbol: 'MNEE', names: ['MNEE'] },
  { symbol: 'ZUSD', names: ['ZUSD'] },
  { symbol: 'IDRT', names: ['Rupiah Token'] },
  { symbol: 'GYEN', names: ['GYEN'] },
  { symbol: 'BIDR', names: ['BIDR'] },
  { symbol: 'USDJ', names: ['USDJ'] },
  { symbol: 'VCHF', names: ['VNX Swiss Franc'] },
  { symbol: 'USDV', names: ['Verified USD'] },
  { symbol: 'YUSD', names: ['Aegis YUSD'] },
  { symbol: 'SBD', names: ['Steem Dollars'] },
  { symbol: 'OUSD', names: ['Origin Dollar'] },
  { symbol: 'vDAI', names: ['Venus DAI'] },
  { symbol: 'WUSD', names: ['Worldwide USD'] },
  { symbol: 'USDR', names: ['StablR USD'] },
  { symbol: 'CEUR', names: ['Celo Euro'] },
  { symbol: 'VEUR', names: ['VNX Euro'] },
  { symbol: 'USDN', names: ['SMARDEX USDN', 'Neutral AI'] },
  { symbol: 'DJED', names: ['Djed'] },
  { symbol: 'EURR', names: ['StablR Euro'] },
  { symbol: 'VAI', names: ['Vai'] },
  { symbol: 'FEI', names: ['Fei USD'] },
  { symbol: 'EURQ', names: ['Quantoz EURQ'] },
  { symbol: 'USDs', names: ['Sperax USD'] },
  { symbol: 'MKUSD', names: ['Prisma mkUSD'] },
  { symbol: 'USDS', names: ['TheStandard USD'] },
  { symbol: 'ESD', names: ['Empty Set Dollar'] },
  { symbol: 'IDRX', names: ['IDRX'] },
  { symbol: 'BAC', names: ['Basis Cash'] },
  { symbol: 'AUSD', names: ['AUSD'] },
  { symbol: 'GHO', names: ['GHO'] },
  { symbol: 'xUSD', names: ['xUSD'] },
  { symbol: 'USD+', names: ['Overnight.fi USD+'] },
  { symbol: 'BUCK', names: ['Bucket Protocol BUCK Stablecoin'] },
  { symbol: 'AMAPT', names: ['Amnis Aptos Coin'] },
  { symbol: 'DOLA', names: ['DOLA'] },
  { symbol: 'USDQ', names: ['Quantoz USDQ'] },
  { symbol: 'FRXUSD', names: ['Frax USD'] },
  { symbol: 'xDAI', names: ['xDAI'] },
  { symbol: 'GYD', names: ['Gyroscope GYD'] },
  { symbol: 'FXD', names: ['Fathom Dollar'] },
  { symbol: 'MIM', names: ['Magic Internet Money'] },
  { symbol: 'USDZ', names: ['Zedxion'] },
  { symbol: 'XIDR', names: ['XIDR'] },
  { symbol: 'SDAI', names: ['Savings Dai'] },
  { symbol: 'JPYC', names: ['JPYC Prepaid', 'JPY Coin v1'] },
  { symbol: 'EDLC', names: ['Edelcoin'] },
  { symbol: 'BBUSD', names: ['BounceBit USD'] },
  { symbol: 'EURA', names: ['Angle Protocol'] },
  { symbol: 'USDH', names: ['USDH'] },
  { symbol: 'DUSD', names: ['Decentralized USD'] },
  { symbol: 'BRZ', names: ['Brazilian Digital Token'] },
  { symbol: 'MIMATIC', names: ['MAI'] },
  { symbol: 'USD1', names: ['USD One'] },
  { symbol: 'SBC', names: ['Stable Coin'] },
  { symbol: 'IST', names: ['Inter Stable Token'] },
  { symbol: 'ZARP', names: ['ZARP Stablecoin'] },
  { symbol: 'MTR', names: ['Meter Stable'] },
  { symbol: 'MXNt', names: ['Tether MXNt'] },
  { symbol: 'UXD', names: ['Criptodólar'] },
  { symbol: 'TOR', names: ['TOR'] },
  { symbol: 'lvlUSD', names: ['Level'] }
];

async function fetchCoinsMarkets(page: number): Promise<CoinGeckoResponse[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=${page}&sparkline=false`,
      {
        headers: {
          'x-cg-pro-api-key': API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    return [];
  }
}

async function fetchCoinDetails(coinId: string): Promise<CoinGeckoResponse | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          'x-cg-pro-api-key': API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for ${coinId}:`, error);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchCoinsInBatches() {
  const matches: Record<string, CoinGeckoResponse[]> = {};
  let totalSearched = 0;
  const TWO_MINUTES = 120000; // 2 minutes in milliseconds
  
  try {
    // First get a list of all coins
    for (let page = 1; page <= 40; page++) { // Assuming we want to search through 1000 coins (40 pages * 25 coins)
      console.log(`\nSearching page ${page} (${totalSearched} coins searched)...`);
      
      const coins = await fetchCoinsMarkets(page);
      
      if (!coins.length) {
        console.log('No more coins found');
        break;
      }

      totalSearched += coins.length;

      // Process this batch
      coins.forEach((coin) => {
        stablecoins.forEach(stablecoin => {
          const matchesSymbol = coin.symbol.toLowerCase() === stablecoin.symbol.toLowerCase();
          const matchesName = stablecoin.names.some(name => 
            coin.name.toLowerCase().includes(name.toLowerCase())
          );

          if (matchesSymbol || matchesName) {
            if (!matches[stablecoin.symbol]) {
              matches[stablecoin.symbol] = [];
            }
            if (!matches[stablecoin.symbol].some(match => match.id === coin.id)) {
              matches[stablecoin.symbol].push(coin);
            }
          }
        });
      });

      // If we've processed 25 coins, wait for 2 minutes
      if (page % 25 === 0) {
        console.log('\nWaiting 2 minutes before next batch...');
        await delay(TWO_MINUTES);
      } else {
        // Small delay between regular requests
        await delay(1500); // 1.5 second delay between requests
      }
    }

    // Now fetch detailed information for each matched coin
    console.log('\nFetching detailed information for matched coins...');
    
    for (const [symbol, coins] of Object.entries(matches)) {
      for (const coin of coins) {
        const details = await fetchCoinDetails(coin.id);
        if (details?.market_data) {
          coin.market_data = details.market_data;
        }
        await delay(1500); // 1.5 second delay between requests
      }
    }

    console.log('\n=== SEARCH RESULTS ===');
    console.log(`Total coins searched: ${totalSearched}\n`);
    
    let totalMatches = 0;
    Object.entries(matches).forEach(([symbol, coins]) => {
      if (coins.length > 0) {
        console.log(`\n${symbol}:`);
        coins.forEach(coin => {
          const marketCap = coin.market_data?.market_cap?.usd 
            ? `$${(coin.market_data.market_cap.usd / 1e9).toFixed(2)}B`
            : 'N/A';
          const volume = coin.market_data?.total_volume?.usd
            ? `$${(coin.market_data.total_volume.usd / 1e6).toFixed(2)}M`
            : 'N/A';
          
          console.log(`  ID: ${coin.id.padEnd(20)} | ${coin.symbol.padEnd(8)} | ${coin.name.padEnd(30)} | MC: ${marketCap.padEnd(10)} | Vol: ${volume}`);
        });
        totalMatches += coins.length;
      }
    });

    console.log(`\nTotal matches found: ${totalMatches}`);

    // Save results to a file
    const results = {
      totalSearched,
      totalMatches,
      matches,
      timestamp: new Date().toISOString(),
    };
    
    writeFileSync('coingecko-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to coingecko-results.json');

    // List stablecoins with no matches
    const noMatches = stablecoins.filter(coin => !matches[coin.symbol] || matches[coin.symbol].length === 0);
    if (noMatches.length > 0) {
      console.log('\nStablecoins with no matches:');
      noMatches.forEach(coin => {
        console.log(`  ${coin.symbol} (${coin.names.join(', ')})`);
      });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

console.log('Searching for stablecoin IDs using CoinGecko API...\n');
searchCoinsInBatches();