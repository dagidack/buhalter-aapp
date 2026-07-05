export type Language = "ru" | "fi" | "en";

export type DashboardCopy = {
  appName: string;
  subtitle: string;
  languageLabel: string;
  uploadTitle: string;
  uploadDrop: string;
  uploadHint: string;
  uploadInProgress: string;
  uploadSuccess: string;
  uploadOpen: string;
  uploadError: string;
  overviewTitle: string;
  overallPeriod: string;
  selectedDayLabel: string;
  transactionsTitle: string;
  noTransactions: string;
  chartTitle: string;
  chartDescription: string;
  dayChartTitle: string;
  daySummaryTitle: string;
  totalLabel: string;
  countLabel: string;
  downloadPdf: string;
  statementTitle: string;
  statementGenerated: string;
  statementDateLabel: string;
  statementMerchantLabel: string;
  statementAmountLabel: string;
  statementNoData: string;
  formTitle: string;
  formSubtitle: string;
  dateLabel: string;
  amountLabel: string;
  nameLabel: string;
  businessIdLabel: string;
  attachmentLabel: string;
  saveButton: string;
  cancelButton: string;
  editButton: string;
  deleteButton: string;
  lockButton: string;
  unlockButton: string;
  clearAllButton: string;
  periodLabel: string;
  periodAll: string;
  periodDay: string;
  periodWeek: string;
  periodMonth: string;
  periodQuarter: string;
  periodYear: string;
  periodCustom: string;
  fromLabel: string;
  toLabel: string;
  attachmentHint: string;
  noAttachment: string;
  driveLink: string;
  transactionCardTitle: string;
  lockedWarning: string;
  searchPlaceholder: string;
  sortLabel: string;
  sortNewest: string;
  sortOldest: string;
  serviceLabel: string;
  servicePlaceholder: string;
  typeLabel: string;
  typeIncome: string;
  typeExpense: string;
  incomeBadge: string;
  expenseBadge: string;
  summaryTotalLabel: string;
  summaryIncomeLabel: string;
  summaryExpenseLabel: string;
  statementRangeLabel: string;
};

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "fi", label: "Suomi" },
  { value: "en", label: "English" },
];

export const DEFAULT_LANGUAGE: Language = "ru";

// VERSION 1.4: Add version tracking and localization strings
export function getDashboardCopy(language: Language): DashboardCopy {
  switch (language) {
    case "fi":
      return {
        appName: "RM Finance",
        subtitle: "Henkilökohtainen talouden seuranta",
        languageLabel: "Kieli",
        uploadTitle: "Laskun tai kuitin lataus",
        uploadDrop: "Vedä kuva tai PDF tähän",
        uploadHint: "tai napsauta valitaksesi tiedoston",
        uploadInProgress: "Ladataan...",
        uploadSuccess: "Kuitti tallennettiin",
        uploadOpen: "Avaa",
        uploadError: "Lataus epäonnistui",
        overviewTitle: "Talouden yleiskuva",
        overallPeriod: "Katso tapahtumat koko ajanjaksolta tai valitulta aikaväliltä",
        selectedDayLabel: "Valittu aikaväli",
        transactionsTitle: "Tapahtumat",
        noTransactions: "Tapahtumia ei ole vielä",
        chartTitle: "Tapahtumien kehitys",
        chartDescription: "Seuraa kuluja koko ajanjaksolta tai valitulta aikaväliltä",
        dayChartTitle: "Valitun aikavälin tapahtumat",
        daySummaryTitle: "Yhteenveto",
        totalLabel: "Yhteensä",
        countLabel: "Määrä",
        downloadPdf: "Lataa PDF",
        statementTitle: "Tiliote",
        statementGenerated: "Luotu",
        statementDateLabel: "Päivämäärä",
        statementMerchantLabel: "Toimittaja",
        statementAmountLabel: "Määrä",
        statementNoData: "Ei tapahtumia",
        formTitle: "Lisää uusi merkintä",
        formSubtitle: "Syötä päivämäärä, summa, nimi ja Youtunus-yritystunnus",
        dateLabel: "Päivämäärä",
        amountLabel: "Summa",
        nameLabel: "Nimi",
        businessIdLabel: "Youtunus-liiketoimintatunnus",
        attachmentLabel: "Liitä lasku tai kuitti",
        saveButton: "Tallenna merkintä",
        cancelButton: "Peruuta",
        editButton: "Muokkaa",
        deleteButton: "Poista",
        lockButton: "Lukitse",
        unlockButton: "Avaa lukitus",
        clearAllButton: "Tyhjennä kaikki",
        periodLabel: "Aikaväli",
        periodAll: "Kaikki",
        periodDay: "Päivä",
        periodWeek: "Viikko",
        periodMonth: "Kuukausi",
        periodQuarter: "Neljännesvuosi",
        periodYear: "Vuosi",
        periodCustom: "Mukautettu",
        fromLabel: "Alkaen",
        toLabel: "Asti",
        attachmentHint: "Valinnainen kuva tai PDF",
        noAttachment: "Ei liitettä",
        driveLink: "Avaa Google Drivessa",
        transactionCardTitle: "Tapahtuman yksityiskohdat",
        lockedWarning: "Tämä merkintä on lukittu ja sitä ei voi muokata",
        searchPlaceholder: "Hae nimen, toimittajan tai tunnuksen perusteella...",
        sortLabel: "Lajittelu",
        sortNewest: "Uusin ensin",
        sortOldest: "Vanhin ensin",
        serviceLabel: "Palvelu",
        servicePlaceholder: "Kirjoita, mistä palvelusta on kyse",
        typeLabel: "Tyyppi",
        typeIncome: "Tulo",
        typeExpense: "Meno",
        incomeBadge: "Tulo",
        expenseBadge: "Meno",
        summaryTotalLabel: "Kokonaismäärä",
        summaryIncomeLabel: "Tulot",
        summaryExpenseLabel: "Menot",
        statementRangeLabel: "Väliltä",
      };
    case "en":
      return {
        appName: "RM Finance",
        subtitle: "Personal finance tracking",
        languageLabel: "Language",
        uploadTitle: "Upload a receipt",
        uploadDrop: "Drag a photo or PDF here",
        uploadHint: "or click to choose a file",
        uploadInProgress: "Uploading...",
        uploadSuccess: "Receipt uploaded",
        uploadOpen: "Open",
        uploadError: "Upload failed",
        overviewTitle: "Finance overview",
        overallPeriod: "Review transactions across the full period or a selected range",
        selectedDayLabel: "Selected period",
        transactionsTitle: "Transactions",
        noTransactions: "No transactions yet",
        chartTitle: "Transaction trend",
        chartDescription: "Track spending across the full period or a selected time range",
        dayChartTitle: "Transactions for the selected range",
        daySummaryTitle: "Period summary",
        totalLabel: "Total",
        countLabel: "Count",
        downloadPdf: "Download PDF",
        statementTitle: "Statement",
        statementGenerated: "Generated",
        statementDateLabel: "Date",
        statementMerchantLabel: "Merchant",
        statementAmountLabel: "Amount",
        statementNoData: "No transactions",
        formTitle: "Add a new entry",
        formSubtitle: "Enter the date, amount, name, and Youtunus business ID",
        dateLabel: "Date",
        amountLabel: "Amount",
        nameLabel: "Name",
        businessIdLabel: "Youtunus business ID",
        attachmentLabel: "Attach an invoice or receipt",
        saveButton: "Save entry",
        cancelButton: "Cancel",
        editButton: "Edit",
        deleteButton: "Delete",
        lockButton: "Lock",
        unlockButton: "Unlock",
        clearAllButton: "Clear all",
        periodLabel: "Time period",
        periodAll: "All",
        periodDay: "Day",
        periodWeek: "Week",
        periodMonth: "Month",
        periodQuarter: "Quarter",
        periodYear: "Year",
        periodCustom: "Custom",
        fromLabel: "From",
        toLabel: "To",
        attachmentHint: "Optional image or PDF",
        noAttachment: "No attachment",
        driveLink: "Open in Google Drive",
        transactionCardTitle: "Transaction details",
        lockedWarning: "This entry is locked and cannot be edited",
        searchPlaceholder: "Search by name, merchant, or ID...",
        sortLabel: "Sort",
        sortNewest: "Newest first",
        sortOldest: "Oldest first",
        serviceLabel: "Service",
        servicePlaceholder: "Describe what this service was for",
        typeLabel: "Type",
        typeIncome: "Income",
        typeExpense: "Expense",
        incomeBadge: "Income",
        expenseBadge: "Expense",
        summaryTotalLabel: "Total for period",
        summaryIncomeLabel: "Income",
        summaryExpenseLabel: "Expenses",
        statementRangeLabel: "From",
      };
    case "ru":
    default:
      return {
        appName: "RM Finance",
        subtitle: "Личный учёт расходов",
        languageLabel: "Язык",
        uploadTitle: "Загрузка чека",
        uploadDrop: "Перетащите фото или PDF сюда",
        uploadHint: "или нажмите для выбора",
        uploadInProgress: "Загрузка...",
        uploadSuccess: "Чек загружен",
        uploadOpen: "Открыть",
        uploadError: "Ошибка загрузки",
        overviewTitle: "Обзор финансов",
        overallPeriod: "Смотрите транзакции за весь период или за выбранный диапазон",
        selectedDayLabel: "Выбранный период",
        transactionsTitle: "Транзакции",
        noTransactions: "Транзакций пока нет",
        chartTitle: "Динамика транзакций",
        chartDescription: "Отслеживайте расходы за весь период или выбранный интервал",
        dayChartTitle: "Транзакции за выбранный период",
        daySummaryTitle: "Итог по периоду",
        totalLabel: "Итого",
        countLabel: "Количество",
        downloadPdf: "Скачать PDF",
        statementTitle: "Выписка",
        statementGenerated: "Сгенерировано",
        statementDateLabel: "Дата",
        statementMerchantLabel: "Контрагент",
        statementAmountLabel: "Сумма",
        statementNoData: "Нет транзакций",
        formTitle: "Добавить новую запись",
        formSubtitle: "Введите дату, сумму, название и бизнес-ID Youtunus",
        dateLabel: "Дата",
        amountLabel: "Сумма",
        nameLabel: "Название",
        businessIdLabel: "Бизнес-ID Youtunus",
        attachmentLabel: "Прикрепить счёт или чек",
        saveButton: "Сохранить запись",
        cancelButton: "Отмена",
        editButton: "Изменить",
        deleteButton: "Удалить",
        lockButton: "Заблокировать",
        unlockButton: "Разблокировать",
        clearAllButton: "Очистить всё",
        periodLabel: "Период",
        periodAll: "Все",
        periodDay: "День",
        periodWeek: "Неделя",
        periodMonth: "Месяц",
        periodQuarter: "Квартал",
        periodYear: "Год",
        periodCustom: "Свой",
        fromLabel: "С",
        toLabel: "По",
        attachmentHint: "Необязательно: фото или PDF",
        noAttachment: "Нет вложения",
        driveLink: "Открыть в Google Drive",
        transactionCardTitle: "Детали транзакции",
        lockedWarning: "Эта запись заблокирована и не может быть изменена",
        searchPlaceholder: "Поиск по названию, контрагенту или ID...",
        sortLabel: "Сортировка",
        sortNewest: "Новые сначала",
        sortOldest: "Старые сначала",
        serviceLabel: "Услуга",
        servicePlaceholder: "Опишите, за что была эта услуга",
        typeLabel: "Тип",
        typeIncome: "Доход",
        typeExpense: "Расход",
        incomeBadge: "Доход",
        expenseBadge: "Расход",
        summaryTotalLabel: "Итог за период",
        summaryIncomeLabel: "Доходы",
        summaryExpenseLabel: "Расходы",
        statementRangeLabel: "с",
      };
  }
}
