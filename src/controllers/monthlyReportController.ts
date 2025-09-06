import path from 'path';
import { Request, Response } from 'express';
import { authorize, uploadFileToDrive } from '../services/googleDriveService';
import { generateMonthlyReportPDF, MonthlyReportUser } from '../services/pdfReportService';
import User from '../models/User';
import Salary from '../models/Salary';
import Expense from '../models/Expense';

// ID da pasta do Google Drive onde os relatórios serão salvos
const GOOGLE_DRIVE_FOLDER_ID = '1ARdpGJ11ZWI7JnDPpozQyHQGI7Tt0k0M';

export async function generateAndSendMonthlyReport(req: Request, res: Response) {
  try {
    // Calcular mês e ano anterior
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0 = janeiro, 11 = dezembro
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    const monthStr = String(month).padStart(2, '0');
    const fileName = `relatorio-mensal-${monthStr}-${year}.pdf`;
    const outputPath = path.join(process.cwd(), fileName);

  // Buscar dados dos usuários
  const users = await User.find();
    const reportData: MonthlyReportUser[] = [];
    for (const user of users) {
      // Buscar salário do mês
      const salaryDoc = await Salary.findOne({ user: user._id, 
        date: {
          $gte: new Date(`${year}-${monthStr}-01T00:00:00.000Z`),
          $lte: new Date(`${year}-${monthStr}-31T23:59:59.999Z`)
        }
      });
      const salary = salaryDoc ? salaryDoc.value : 0;

      // Buscar despesas do mês
      const expensesArr = await Expense.find({ user: user._id, 
        date: {
          $gte: new Date(`${year}-${monthStr}-01T00:00:00.000Z`),
          $lte: new Date(`${year}-${monthStr}-31T23:59:59.999Z`)
        }
      });
      const expenses = expensesArr.reduce((sum, exp) => sum + exp.value, 0);

      reportData.push({
        name: user.name,
        email: user.email,
        salary,
        expenses,
        balance: salary - expenses,
      });
    }

    // Gerar PDF
    await generateMonthlyReportPDF(reportData, monthStr, year, outputPath);

    // Autenticar e enviar para o Google Drive
    const auth = await authorize();
    const fileId = await uploadFileToDrive(auth, outputPath, GOOGLE_DRIVE_FOLDER_ID, fileName);

    res.json({ success: true, fileId });
  } catch (err) {
    console.error('Erro ao gerar/enviar relatório:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
