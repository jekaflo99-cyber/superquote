// Service para gerenciar desbloqueios diários via rewarded ads

interface DailyUnlocks {
  date: string; // YYYY-MM-DD
  templateUnlocked: string | null; // ID do template desbloqueado hoje
  presetUnlocked: string | null; // ID do preset desbloqueado hoje
}

class DailyUnlockService {
  private readonly STORAGE_KEY = 'superquote_daily_unlocks';

  // Pega o dia atual como string
  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // Carrega dados do localStorage
  private loadData(): DailyUnlocks {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) {
      return this.createFreshDay();
    }

    try {
      const data: DailyUnlocks = JSON.parse(saved);
      
      // Se mudou o dia, reseta
      if (data.date !== this.getTodayString()) {
        return this.createFreshDay();
      }

      return data;
    } catch {
      return this.createFreshDay();
    }
  }

  // Cria dados para um novo dia
  private createFreshDay(): DailyUnlocks {
    const freshData: DailyUnlocks = {
      date: this.getTodayString(),
      templateUnlocked: null,
      presetUnlocked: null,
    };
    this.saveData(freshData);
    return freshData;
  }

  // Salva dados no localStorage
  private saveData(data: DailyUnlocks) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Verifica se ainda pode desbloquear template hoje
  canUnlockTemplate(): boolean {
    const data = this.loadData();
    return data.templateUnlocked === null;
  }

  // Verifica se ainda pode desbloquear preset hoje
  canUnlockPreset(): boolean {
    const data = this.loadData();
    return data.presetUnlocked === null;
  }

  // Desbloqueia template (após rewarded ad)
  unlockTemplate(templateId: string): boolean {
    const data = this.loadData();
    if (data.templateUnlocked !== null) {
      return false; // Já usou hoje
    }

    data.templateUnlocked = templateId;
    this.saveData(data);
    console.log(`Template ${templateId} desbloqueado até meia-noite!`);
    return true;
  }

  // Desbloqueia preset (após rewarded ad)
  unlockPreset(presetId: string): boolean {
    const data = this.loadData();
    if (data.presetUnlocked !== null) {
      return false; // Já usou hoje
    }

    data.presetUnlocked = presetId;
    this.saveData(data);
    console.log(`Preset ${presetId} desbloqueado até meia-noite!`);
    return true;
  }

  // Verifica se um template específico está desbloqueado hoje
  isTemplateUnlocked(templateId: string): boolean {
    const data = this.loadData();
    return data.templateUnlocked === templateId;
  }

  // Verifica se um preset específico está desbloqueado hoje
  isPresetUnlocked(presetId: string): boolean {
    const data = this.loadData();
    return data.presetUnlocked === presetId;
  }

  // Pega ID do template desbloqueado hoje (se houver)
  getTodayTemplateId(): string | null {
    const data = this.loadData();
    return data.templateUnlocked;
  }

  // Pega ID do preset desbloqueado hoje (se houver)
  getTodayPresetId(): string | null {
    const data = this.loadData();
    return data.presetUnlocked;
  }

  // Reseta (para testes)
  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Daily unlocks resetados!');
  }
}

export const dailyUnlockService = new DailyUnlockService();
