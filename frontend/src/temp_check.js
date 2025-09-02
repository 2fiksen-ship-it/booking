                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.payment_no}</TableCell>
                    <TableCell>{getInvoiceNo(payment.invoice_id)}</TableCell>
                    <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell className="font-medium">{payment.amount} دج</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Reports Management Component with Agency Breakdown
const ReportsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [reportType, setReportType] = useState('daily_sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgencies, setSelectedAgencies] = useState('all');
  const [groupByAgency, setGroupByAgency] = useState(true);
  const [reportData, setReportData] = useState(null);
