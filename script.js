class CryptoTracker {
    constructor() {
        this.apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
        this.updateInterval = 30000; // 30 segundos
        this.cryptoGrid = document.getElementById('cryptoGrid');
        this.loading = document.getElementById('loading');
        this.lastUpdateElement = document.getElementById('lastUpdate');
        this.currencySelect = document.getElementById('currency');
        this.currentCurrency = this.currencySelect.value; // Inicializa com a moeda selecionada
        
        this.init();
    }

    async init() {
        this.currencySelect.addEventListener('change', () => {
            this.currentCurrency = this.currencySelect.value;
            this.fetchCryptoData();
        });
        await this.fetchCryptoData();
        this.startAutoUpdate();
    }

    async fetchCryptoData() {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiUrl}?vs_currency=${this.currentCurrency}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=1h,24h,7d`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayCryptoData(data);
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            this.showError('Erro ao carregar dados das criptomoedas. Tentando novamente...');
        } finally {
            this.showLoading(false);
        }
    }

    displayCryptoData(cryptos) {
        this.cryptoGrid.innerHTML = '';
        
        cryptos.forEach((crypto, index) => {
            const card = this.createCryptoCard(crypto, index + 1);
            this.cryptoGrid.appendChild(card);
        });
    }

    createCryptoCard(crypto, rank) {
        const card = document.createElement('div');
        card.className = 'crypto-card';
        
        const price = this.formatPrice(crypto.current_price);
        const marketCap = this.formatLargeNumber(crypto.market_cap);
        const volume = this.formatLargeNumber(crypto.total_volume);
        
        const change1h = crypto.price_change_percentage_1h_in_currency || 0;
        const change24h = crypto.price_change_percentage_24h || 0;
        const change7d = crypto.price_change_percentage_7d_in_currency || 0;
        
        const currencySymbol = this.getCurrencySymbol(this.currentCurrency);

        card.innerHTML = `
            <div class="crypto-header">
                <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
                <div class="crypto-info">
                    <h3>${crypto.name}</h3>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                </div>
                <div class="crypto-rank">#${rank}</div>
            </div>
            
            <div class="crypto-price">${currencySymbol}${price}</div>
            
            <div class="crypto-changes">
                <div class="change-item">
                    <div class="change-label">1h</div>
                    <div class="change-value ${change1h >= 0 ? 'positive' : 'negative'}">
                        ${change1h >= 0 ? '+' : ''}${change1h.toFixed(2)}%
                    </div>
                </div>
                <div class="change-item">
                    <div class="change-label">24h</div>
                    <div class="change-value ${change24h >= 0 ? 'positive' : 'negative'}">
                        ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
                    </div>
                </div>
                <div class="change-item">
                    <div class="change-label">7d</div>
                    <div class="change-value ${change7d >= 0 ? 'positive' : 'negative'}">
                        ${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%
                    </div>
                </div>
            </div>
            
            <div class="crypto-stats">
                <div class="stat-item">
                    <span class="stat-label">Market Cap:</span>
                    <span class="stat-value">${currencySymbol}${marketCap}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Volume 24h:</span>
                    <span class="stat-value">${currencySymbol}${volume}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Máxima 24h:</span>
                    <span class="stat-value">${currencySymbol}${this.formatPrice(crypto.high_24h)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Mínima 24h:</span>
                    <span class="stat-value">${currencySymbol}${this.formatPrice(crypto.low_24h)}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    formatPrice(price) {
        const locale = this.getLocale(this.currentCurrency);
        if (price >= 1) {
            return price.toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            return price.toFixed(6);
        }
    }

    formatLargeNumber(num) {
        const locale = this.getLocale(this.currentCurrency);
        if (num >= 1e12) {
            return (num / 1e12).toLocaleString(locale, { maximumFractionDigits: 2 }) + 'T';
        } else if (num >= 1e9) {
            return (num / 1e9).toLocaleString(locale, { maximumFractionDigits: 2 }) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toLocaleString(locale, { maximumFractionDigits: 2 }) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toLocaleString(locale, { maximumFractionDigits: 2 }) + 'K';
        } else {
            return num.toLocaleString(locale, { maximumFractionDigits: 2 });
        }
    }

    getCurrencySymbol(currency) {
        switch (currency) {
            case 'usd': return '$';
            case 'brl': return 'R$';
            case 'eur': return '€';
            case 'gbp': return '£';
            case 'jpy': return '¥';
            default: return '';
        }
    }

    getLocale(currency) {
        switch (currency) {
            case 'usd': return 'en-US';
            case 'brl': return 'pt-BR';
            case 'eur': return 'de-DE'; // Exemplo para Euro, pode ser ajustado
            case 'gbp': return 'en-GB';
            case 'jpy': return 'ja-JP';
            default: return 'en-US';
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('pt-BR');
        this.lastUpdateElement.textContent = `${dateString} às ${timeString}`;
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.cryptoGrid.style.display = show ? 'none' : 'grid';
    }

    showError(message) {
        this.cryptoGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: white; background: rgba(239, 68, 68, 0.2); padding: 20px; border-radius: 15px; border: 1px solid rgba(239, 68, 68, 0.3);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                <p style="font-size: 1.1rem;">${message}</p>
            </div>
        `;
    }

    startAutoUpdate() {
        // Limpa qualquer intervalo anterior para evitar múltiplos intervalos
        if (this.autoUpdateIntervalId) {
            clearInterval(this.autoUpdateIntervalId);
        }
        this.autoUpdateIntervalId = setInterval(() => {
            this.fetchCryptoData();
        }, this.updateInterval);
        
        console.log(`Auto-update iniciado. Atualizando a cada ${this.updateInterval / 1000} segundos.`);
    }
}

// Inicializar o tracker quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTracker();
});

// Adicionar funcionalidade de refresh manual
document.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        location.reload();
    }
});

