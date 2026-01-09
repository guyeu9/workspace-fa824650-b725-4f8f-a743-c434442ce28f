// 文件导出功能

export interface ExportResult {
  success: boolean;
  error?: string;
}

// 导出JSON文件
export const exportJsonFile = async (filename: string, data: any): Promise<ExportResult> => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败'
    };
  }
};

// 导出文本文件
export const exportTextFile = async (filename: string, content: string): Promise<ExportResult> => {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败'
    };
  }
};
