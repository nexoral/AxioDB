interface NpmDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface NpmDownloadsRange {
  downloads: Array<{
    downloads: number;
    day: string;
  }>;
  start: string;
  end: string;
  package: string;
}

interface NpmPackageInfo {
  name: string;
  version: string;
  description: string;
  'dist-tags': {
    latest: string;
  };
  downloads?: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
}

class NpmApiService {
  private downloadsApiUrl = 'https://api.npmjs.org/downloads';
  private registryUrl = 'https://registry.npmjs.org';
  private packageName = 'axiodb';

  private async fetchFromNpm<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AxioDB-Documentation'
        }
      });

      if (!response.ok) {
        throw new Error(`npm API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('npm API fetch error:', error);
      throw error;
    }
  }

  async getDownloadsLastMonth(): Promise<NpmDownloads> {
    return this.fetchFromNpm<NpmDownloads>(
      `${this.downloadsApiUrl}/point/last-month/${this.packageName}`
    );
  }

  async getDownloadsLastWeek(): Promise<NpmDownloads> {
    return this.fetchFromNpm<NpmDownloads>(
      `${this.downloadsApiUrl}/point/last-week/${this.packageName}`
    );
  }

  async getDownloadsLastDay(): Promise<NpmDownloads> {
    return this.fetchFromNpm<NpmDownloads>(
      `${this.downloadsApiUrl}/point/last-day/${this.packageName}`
    );
  }

  async getDownloadsRange(period: 'last-day' | 'last-week' | 'last-month' | 'last-year'): Promise<NpmDownloadsRange> {
    return this.fetchFromNpm<NpmDownloadsRange>(
      `${this.downloadsApiUrl}/range/${period}/${this.packageName}`
    );
  }

  async getTotalDownloads(): Promise<number> {
    try {
      // Get downloads from inception to now
      const response = await this.fetchFromNpm<NpmDownloads>(
        `${this.downloadsApiUrl}/point/2020-01-01:${new Date().toISOString().split('T')[0]}/${this.packageName}`
      );
      return response.downloads;
    } catch (error) {
      console.error('Failed to get total downloads:', error);
      // Fallback to last month if total fails
      const lastMonth = await this.getDownloadsLastMonth();
      return lastMonth.downloads;
    }
  }

  async getPackageInfo(): Promise<NpmPackageInfo> {
    const data = await this.fetchFromNpm<NpmPackageInfo>(
      `${this.registryUrl}/${this.packageName}`
    );

    // Fetch download stats and merge
    const [lastDay, lastWeek, lastMonth] = await Promise.all([
      this.getDownloadsLastDay().catch(() => ({ downloads: 0 } as NpmDownloads)),
      this.getDownloadsLastWeek().catch(() => ({ downloads: 0 } as NpmDownloads)),
      this.getDownloadsLastMonth().catch(() => ({ downloads: 0 } as NpmDownloads))
    ]);

    return {
      ...data,
      downloads: {
        lastDay: lastDay.downloads,
        lastWeek: lastWeek.downloads,
        lastMonth: lastMonth.downloads
      }
    };
  }

  formatDownloadCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  getNpmPackageUrl(): string {
    return `https://www.npmjs.com/package/${this.packageName}`;
  }
}

export const npmApi = new NpmApiService();
export type { NpmDownloads, NpmDownloadsRange, NpmPackageInfo };
