import { Request, Response } from 'express';
import { handleBackendError, throwBffError } from '@common/util/response-handler.js';
import { apiClientGet } from '@common/config/apiClient.js';
import { JAVA_API_URL } from '@common/config/env.js';
import { buildReportHtml, TemplateConfig } from '@common/utils/report-html-template.js';
import { generatePdf } from '@common/utils/pdf-generator.js';

/**
 * POST /adm-016/report-templates/generate-pdf
 * Body: { templateId: number, reportId: number }
 *
 * Fetches template config + report data, renders HTML via Puppeteer → PDF binary.
 */
export const handle = async (req: Request, res: Response) => {
  try {
    const idToken = req.authTokens?.idToken;
    if (!idToken) return throwBffError('Authentication required', 401);

    const { templateId, reportId } = req.body;
    if (!templateId || !reportId) {
      return throwBffError('templateId and reportId are required', 400);
    }

    const headers = { Authorization: `Bearer ${idToken}` };

    // 1. Fetch template config
    const templateRes = await apiClientGet(
      `/api/v1/admin/report-templates/${templateId}`,
      { baseURL: JAVA_API_URL, headers },
    );
    const templateData = templateRes.data;
    const config: TemplateConfig = JSON.parse(templateData.configJson || '{}');

    // 2. Fetch report data
    const reportRes = await apiClientGet(
      `/api/v1/admin/reports/status/${reportId}`,
      { baseURL: JAVA_API_URL, headers },
    );
    const reportData = reportRes.data;

    if (reportData.status !== 'DONE') {
      return throwBffError('Report is not ready yet (status: ' + reportData.status + ')', 400);
    }

    // 3. Build HTML
    const html = buildReportHtml(config, {
      period: reportData.period,
      generatedAt: reportData.generatedAt || '',
      markdown: reportData.markdown || '',
      reportData: reportData.reportData || '{}',
    });

    // 4. Generate PDF
    const pdfBuffer = await generatePdf(html);

    // 5. Return as downloadable PDF
    const filename = `expense-report-${reportData.period || 'report'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);

  } catch (err: any) {
    return handleBackendError(res, err);
  }
};
