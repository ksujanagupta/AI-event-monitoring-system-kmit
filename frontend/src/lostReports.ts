import { API, apiFetch } from './api';

// Mirrors backend/models/LostReport.js
export interface LostReport {
  _id: string;
  type: 'item' | 'child';
  name?: string;
  age?: number;
  item?: string;
  description?: string;
  location?: string;
  reportedBy?: string;
  guardian?: string;
  imagePath?: string;
  status: 'open' | 'found';
  match?: { video?: string; frame?: number; output_url?: string };
  createdAt: string;
}

export const reportTime = (r: LostReport) =>
  new Date(r.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const reportImage = (r: LostReport) => (r.imagePath ? `${API}${r.imagePath}` : undefined);

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || res.statusText);
  return data;
}

export const loadLostReports = async () => json<LostReport[]>(await apiFetch('/api/lost-reports'));

export async function createLostReport(fields: Record<string, string>, image: Blob | null, match?: LostReport['match']) {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => body.append(k, v));
  if (image) body.append('image', image, 'report.jpg');
  if (match) body.append('match', JSON.stringify(match));
  return json<LostReport>(await apiFetch('/api/lost-reports', { method: 'POST', body }));
}

export const markReportFound = async (id: string) =>
  json<LostReport>(await apiFetch(`/api/lost-reports/${id}/found`, { method: 'PATCH' }));
