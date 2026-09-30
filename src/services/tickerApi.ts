import type { PublicTickerRate } from "@/interfaces/Ticker/Ticker.model";
import { apiClient } from "@/services/apiClient";

interface PublicTickerResponse {
  data: PublicTickerRate[];
}

export const tickerApi = {
  async getRates(): Promise<PublicTickerRate[]> {
    const response = await apiClient.get<PublicTickerResponse>("public/ticker", {
      silent: true,
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  },
};
