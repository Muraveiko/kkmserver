/**
 * @file Js-библиотека для взаимодействия со специальным сервером, посредством  Ajax запросов.
 * Дополнительные библиотеки не требуются.<br />
 *
 * @author Oleg Muraveyko
 * @version 0.1.0
 *
 * @see Source code on Github  {@link https://github.com/Muraveiko/kkmserver}
 * @see Server API part by Dmitriy Garbuz  {@link https://kkmserver.ru/KkmServer}
 *
 */

// --------------------------------------------------------------------------------------------
//    описание  структур для формирования json запроса к серверу
// --------------------------------------------------------------------------------------------

/**
 * Базовая структура запроса к серверу
 *
 * @param {string} command Имя команды
 * @param {number} [numDevice] устройство
 * @class
 */
function KkmCommand(command, numDevice) {
    /**
     * Название команды, одно из зарегистрированных слов api KkmServer.ru. <br/>
     * необходимые реализованы как методы CommandXXX {@link KkmServer}
     * @type {string}
     */
    this.Command = command;
    /**
     * Номер устройства 0-9 по умолчанию 0 - первое свободное
     * @type {number|null}
     */
    this.NumDevice = numDevice || null;
    /**
     *  Любая строока из 40 символов
     *  По этому идентификатору можно запросить результат выполнения команды.
     *  Поле не обязательно
     *
     *  @summary Уникальный идентификатор команды
     *  @type {string}
     */
    this.IdCommand = '';
}

/**
 * Структура запроса к серверу c ФИО кассира
 *
 * @param {string} command Имя команды
 * @param {string} [cashierName] ФИО Кассира
 * @param {number} [numDevice] устройство
 *
 * @class
 * @extends {KkmCommand}
 */
function KkmCommandWithCashier(command, cashierName, numDevice) {
    KkmCommand.call(this, command, numDevice);
    /**
     * ФИО Кассира
     * @type {string|null}
     */
    this.CashierName = cashierName || null;
}

/**
 * Структура запроса к серверу c суммой операции
 *
 * @param {string} command Имя команды
 * @param {number} amount Сумма
 * @param {string} cashierName ФИО Кассира
 * @param {number} numDevice устройство

 * @class
 * @extends {KkmCommandWithCashier}
 */
function KkmCommandWithAmount(command, amount, cashierName, numDevice) {
    KkmCommandWithCashier.call(this, command, cashierName, numDevice);
    /**
     * Сумма операции
     * @type {number}
     */
    this.Amount = amount || null;
}

/**
 * Команда Список ККТ подключенных к серверу
 * @extends KkmCommand
 * @constructor
 */
function KkmCommandList() {
    KkmCommand.call(this, 'List');
    /**
     * Отбор по ИНН. Строка. Если "" или не указано то первое не блокированное на сервере
     * @type {string}
     */
    this.InnKkm = '';
    /**
     * Отбор активных. Булево. Если null или не указано то активные и не активные
     * @type {boolean|null}
     * @example
     * command = new KkmCommandList();
     * command.InnKkm = '1234567890';
     */
    this.Active = null;
    /**
     * Отбор выключенны-включенных
     * @type {boolean|null}
     * @example
     * command = new KkmCommandList();
     * command.Active = true;
     */
    this.OnOff = null;
    /**
     * Отбор наличию ошибок ОФВ. Булево. Если null или не указано то с ошибками и без
     * @type {boolean|null}
     */
    this.OFD_Error = null;
    /**
     * Все у которых дата не переданного док. в ОФД меньше указанной. Дата-время.
     * @type {string}
     * @example
     * command = new KkmCommandList();
     * command.OFD_DateErrorDoc = '2100-01-01T00:00:00';
     */
    this.OFD_DateErrorDoc = '2100-01-01T00:00:00';
    /**
     * Все у которых дата окончания работы ФН меньше указанной. Дата-время.
     * @type {string}
     */
    this.FN_DateEnd = '2100-01-01T00:00:00';
    /**
     * Все у которых заканчивается память ФН; Булево. Если null или не указано то все
     * @type {boolean|null}
     */
    this.FN_MemOverflowl = null;
    /**
     * Фискализированные или нет ФН; Булево. Если null или не указано то все
     * @type {boolean|null}
     */
    this.FN_IsFiscal = null;
}


/**
 *  Ответ API
 * @property {string} Command [Команда апи]{@link KkmCommand#Command}
 * @property {number} Status Статус исполнения
 * <ul><li>Ok = 0,</li><li>Run(Запущено на выполнение) = 1,</li><li>Error = 2,</li><li>NotFound(устройство не найдено) = 3,</li><li>NotRun = 4</ul>
 * @property {string} Error Пустая строка или текст ошибки
 * @property {string} [URL]
 * @property {string} IdCommand  Уникальный идентификатор комманды, назначенный вами или присвоенный сервером.
 * @property {number} [NumDevice]
 * @class
 */
function KkmResponse() {
}

/**
 * @summary Класс для взаимодействия с API
 * @description Методы класса можно разделить на группы <ul>
 *  <li><b>[CommandXxx]{@link KkmServer#CommandDepositingCash}</b> - возвращают структуру данных для передачи серверу, которую можно модифицировать</li>
 *  <li><b>doXxx</b> - выполняют сразу нужную операцию</li>
 *  <li><b>funXxx</b> - встроенные обработчики AJAX</li>
 *  <li><b>hookXxx</b> - установить свои обработчики для AJAX</li>
 *  <li><b>setXxx</b> - устанавливают параметры по умолчанию для команд</li>
 *  <li><b>execute</b> - посылает ajax запрос серверу с тонкой настройкой</li>
 *  <li><b>чеки</b> - отдельный класс {@link KkmCheck}</li>
 * </ul>
 *
 * Конструктор принимает параметры подключения к серверу :
 * @param {string} user Имя пользователя
 * @param {string} password Пароль
 * @param {string} [urlServer] Адрес сервера
 *
 * @class
 * @example
 * var kkm = new KkmServer('Admin', '').hookAjaxSuccess(ExecuteSuccess);
 * kkm.doOpenShift();
 */
function KkmServer(user, password, urlServer) {
    var self = this;

    urlServer = urlServer || 'http://localhost:5893/';


    var defaults = {
        numDevice: 0,
        cashierName: '',
        innKkm: ''
    };


    var connection = {
        urlServer: urlServer,
        timeout: 60000, //Минута - некоторые драйверы при работе выполняют интерактивные действия с пользователем - тогда увеличте тайм-аут
        auth: ''
    };

    if (undefined !== password || undefined !== user) {
        connection.auth = "Basic " + btoa(user + ":" + password);
    }

    /**
     * Внутрений метод.
     * Советую для регистрации чеков формировать idCommand самостоятельно
     * @returns {string}
     * @private
     */
    var generateCommandId = function () {
        function s4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }

        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    };

    // Предыдущая выполненная команда
    var lastCommand = null;

    /**
     * Передача команды серверу .
     * @param  {KkmCommand|KkmCommandWithCashier|KkmCommandWithAmount|KkmCommandList} command Структура для передачи серверу
     * @returns {KkmCommand|KkmCommandWithCashier|KkmCommandWithAmount|KkmCommandList}
     */
    this.execute = function (command) {

        // внедряем значения по умолчанию
        if (undefined !== command && command.Command) { // If it looks like a duck (KkmCommand)
            if (null === command.NumDevice) {
                command.NumDevice = defaults.numDevice;
            }
            if ('' === command.IdCommand) {
                command.IdCommand = generateCommandId();
            }
            if (null === command.CashierName) { // If it looks like a duck (KkmCommandWithCashier)
                command.CashierName = defaults.cashierName;
            }
        } else {
            throw Error('Апи передана неправильная структура');
        }

        var json = JSON.stringify(command);

        // готовим ajax запрос
        var r = new XMLHttpRequest();
        r.open("POST", connection.urlServer + 'Execute/sync', true);
        r.responseType = 'json';
        r.setRequestHeader("Authorization", connection.auth);
        r.onload = function () {
            funSuccess(r.response);
        };
        r.onerror = function () {
            funError(r, 'ajax error');
        };
        r.send(json);
        return command;
    };

    // -------------------------------------------------------
    //  Встроенные обработчики ajax запроса
    // -------------------------------------------------------

    /**
     * Встроенный обработчик успешного запроса к серверу
     * @param {KkmResponse|object} result
     * @see назначить свой {@link KkmServer#hookAjaxSuccess}
     */
    var funSuccess = function (result) {
        var message = '';
        if ('' !== result.Error) {
            result.Status = 2;
        }
        switch (result.Status) {
            case 2:
                message = 'Ошибка: ' + result.Error + ' Команда: ' + result.Command + ' [' + result.IdCommand + ']';
                break;
            case 0:
                message = 'Успешно: ' + result.Command + ' [' + result.IdCommand + ']';
                break;
            default:
                message = 'Статус: ' + result.Status + ' ' + result.Command + ' [' + result.IdCommand + ']';
        }
        alert(message);
    };

    /**
     * Встроенный обработчик ошибки сети при запросе к серверу
     * @param xhr
     * @param status
     * @see назначить свой {@link KkmServer#hookAjaxFail}
     */
    var funError = function (xhr, status) {


        var response = /** @type KkmResponse */{
            Status: 2,
            Error: "Request failed: " + status,
            Command: lastCommand.Command,
            IdCommand: lastCommand.IdCommand
        };

        funSuccess(response);
    };


    // -------------------------------------------------------
    //  Хуки на обработку результата ajax запроса
    // -------------------------------------------------------
    /**
     *  Обработчик успешного запроса к серверу
     *
     * @param {callbackKkmApi} successHook
     * @returns {KkmServer}
     */
    this.hookAjaxSuccess = function (successHook) {
        funSuccess = successHook;
        return self;
    };

    /**
     * @callback  callbackKkmApi
     * @param {KkmResponse}
     */

    /**
     *  Обработчик ошибки запроса
     *
     * @param {funError} errorHook callback
     * @returns {KkmServer}
     */
    this.hookAjaxFail = function (errorHook) {
        funError = errorHook;
        return self;
    };


    // -------------------------------------------------------
    //  Сеттеры
    // -------------------------------------------------------

    /**
     * Номер Устройства по умолчанию
     * @param {number} numDevice целое 0-9
     * @returns {KkmServer}
     */
    this.setNumDevice = function (numDevice) {
        defaults.numDevice = numDevice;
        return self;
    };

    /**
     * Кассир по умолчанию
     * @param {string} cashierName ФИО
     * @returns {KkmServer}
     */
    this.setCashierName = function (cashierName) {
        defaults.cashierName = cashierName;
        return self;
    };

    /**
     * Инн кассы чтобы чек не ушел неправильно
     * @param {string} innKkm
     * @returns {KkmServer}
     */
    this.setInnKkm = function (innKkm) {
        defaults.innKkm = innKkm;
        return self;
    };

    // -------------------------------------------------------
    //  Конструкторы команд
    // -------------------------------------------------------

    /**
     * Команда Внесение денег в кассу
     * @param {number} amount Сумма
     * @param {string} [cashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithAmount}
     * @see [CommandPaymentCash]{@link CommandPaymentCash}
     */
    this.CommandDepositingCash = function (amount, cashierName, numDevice) {
        return new KkmCommandWithAmount('DepositingCash', amount, cashierName, numDevice);
    };

    /**
     * Команда Получение данных KKT
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.CommandGetDataKKT = function (numDevice) {
        return new KkmCommand("GetDataKKT", numDevice);
    };

    /**
     * Команда Запрос результата выполнения команды
     * @param {string} [idCommand]
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.CommandGetRezult = function (idCommand, numDevice) {
        if (undefined === IdCommand) {
            idCommand = lastCommand.IdCommand;
        }
        if (undefined === numDevice) {
            numDevice = lastCommand.NumDevice;
        }
        var data = new KkmCommand("GetRezult", numDevice);
        data.IdCommand = idCommand;
        return data;
    };

    /**
     * Команда Список подключенных устройств
     * @returns {KkmCommandList}
     */
    this.CommandList = function () {
        return new KkmCommandList();
    };

    /**
     * Команда Выемка наличных
     * @param {number} Amount Сумма
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithAmount}
     */
    this.CommandPaymentCash = function (Amount, CashierName, numDevice) {
        return new KkmCommandWithAmount('PaymentCash', Amount, CashierName, numDevice);
    };

    /**
     * Команда Печать состояния обмена с ОФД
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.CommandOfdReport = function (numDevice) {
        return new KkmCommand("OfdReport", numDevice);
    };

    /**
     * Команда Открыть денежный ящик
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.CommandOpenCashDrawer = function (numDevice) {
        return new KkmCommand("OpenCashDrawer", numDevice);
    };

    /**
     * Команда Окрыть смену
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithCashier}
     */
    this.CommandOpenShift = function (CashierName, numDevice) {
        return new KkmCommandWithCashier('OpenShift', CashierName, numDevice);
    };

    /**
     * Команда Печать Х-отчета
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithCashier}
     */
    this.CommandXReport = function (CashierName, numDevice) {
        return new KkmCommandWithCashier('XReport', numDevice);
    };

    /**
     * Команда Закрытие смены
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithCashier}
     */
    this.CommandZReport = function (CashierName, numDevice) {
        return new KkmCommandWithCashier('ZReport', CashierName, numDevice);
    };


    // -------------------------------------------------------
    //  Выполнение команд на сервере
    // -------------------------------------------------------

    /**
     * Внесение денег в кассу
     * @param {number} Amount Сумма
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithAmount}
     */
    this.doDepositingCash = function (Amount, CashierName, numDevice) {
        return self.execute(self.CommandDepositingCash(Amount, CashierName, numDevice));
    };

    /**
     * Получение данных KKT
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doGetDataKKT = function (numDevice) {
        return self.execute(self.CommandGetDataKKT(numDevice));
    };

    /**
     * Список ККТ подключенных к серверу
     * @returns {KkmCommand}
     */
    this.doGetList = function () {
        return self.execute(self.CommandList());
    };

    /**
     * Запрос результата выполнения команды
     * @param {string} [IdCommand]
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doGetRezult = function (IdCommand, numDevice) {
        return self.execute(self.CommandGetRezult(IdCommand, numDevice));
    };

    /**
     * Выемка наличных
     * @param {number} Amount Сумма
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithAmount}
     */
    this.doPaymentCash = function (Amount, CashierName, numDevice) {
        return self.execute(self.CommandPaymentCash(Amount, CashierName, numDevice));
    };

    /**
     * Печать состояния обмена с ОФД
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doOfdReport = function (numDevice) {
        return self.execute(self.CommandOfdReport(numDevice));
    };

    /**
     * Печать Х-отчета
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doXReport = function (CashierName, numDevice) {
        return self.execute(self.CommandXReport(CashierName, numDevice));
    };

    /**
     * Закрытие смены
     * @param {string} [CashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doZReport = function (CashierName, numDevice) {
        return self.execute(self.CommandZReport(CashierName, numDevice));
    };

    /**
     * Открыть денежный ящик
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doOpenCashDrawer = function (numDevice) {
        return self.execute(self.CommandOpenCashDrawer(numDevice));
    };

    /**
     * Окрыть смену
     * @param {string} [cashierName] имя кассира
     * @param {number} [numDevice] устройство
     * @returns {KkmCommandWithCashier}
     */
    this.doOpenShift = function (cashierName, numDevice) {
        var c = self.CommandOpenShift(cashierName, numDevice);
        return self.execute(c);
    };


    // --------------------------------------------------------------------------------------------
    // Служебное
    // --------------------------------------------------------------------------------------------

    /**
     * Внутрений метод.
     * Советую для регистрации чеков формировать idCommand самостоятельно
     * @returns {string}
     * @private
     */
    this._generateCommandId = function () {
        function s4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }

        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    };

}

// ------------------------------------------------------------------------------------
//  Работа с чеком
// -------------------------------------------------------------------------------------
/**
 * Структура запроса к апи для работы с чеком
 * @param {number} [typeCheck=0] Тип чека
 *  <pre>
 *  0 – продажа;                             10 – покупка;
 *  1 – возврат продажи;                     11 - возврат покупки;
 *  8 - продажа только по ЕГАИС (обычный чек ККМ не печатается)
 *  9 - возврат продажи только по ЕГАИС (обычный чек ККМ не печатается)
 * </pre>
 * @class
 */
function KkmCommandCheck(typeCheck) {

    this.VerFFD = "1.0";
    this.Command = "RegisterCheck";
    this.NumDevice = null;
    this.InnKkm = '';
    this.KktNumber = '';
    this.Timeout = 30;
    this.IdCommand = '';
    this.IsFiscalCheck = true;
    this.TypeCheck = typeCheck || 0;
    this.CancelOpenedCheck = true;
    this.NotPrint = false;
    this.NumberCopies = 0;
    this.CashierName = '';
    this.ClientAddress = '';
    this.TaxVariant = '';
    this.CheckProps = [];
    this.AdditionalProps = [];
    this.KPP = '';
    this.ClientId = '';
    this.KeySubLicensing = '';
    this.CheckStrings = [];
    this.Cash = 0;
    this.CashLessType1 = 0;
    this.CashLessType2 = 0;
    this.CashLessType3 = 0;

}


/**
 * Конструктор Класса Чек
 * (для работы с фискальным документом или слип-чеком)
 *
 * @param {KkmServer} kkm куда посылать
 * @param {number} [typeCheck=0] Тип чека
 *  <pre>
 *  0 – продажа;                             10 – покупка;
 *  1 – возврат продажи;                     11 - возврат покупки;
 *  8 - продажа только по ЕГАИС (обычный чек ККМ не печатается)
 *  9 - возврат продажи только по ЕГАИС (обычный чек ККМ не печатается)
 * </pre>
 * @class
 */
function KkmCheck(kkm, typeCheck) {
    var self = this;
    /**
     * Внедрение зависимости
     * @type {KkmServer}
     */
    this.kkm = kkm;

    /**
     *
     * @type {KkmCommandCheck}
     */
    var data = new KkmCommandCheck(typeCheck);


    // --------------------------------------------------------------------------------------------
    // Сетеры основных свойств
    // --------------------------------------------------------------------------------------------

    /**
     * Используется для  предотвращения ошибочных регистраций
     * чеков на ККТ зарегистрированных с другим
     * ИНН (сравнивается со значением в ФН).
     * Допустимое количество символов 10 или 12.
     * @param {string} innKkm  ИНН организации
     * @returns self
     */
    this.setInn = function (innKkm) {
        data.innKkm = innKkm;
        return self;
    };

    /**
     *  Используется для предотвращения ошибочных регистраций
     *  чеков на ККТ зарегистрированных с другим адресом места
     *  расчёта (сравнивается со значением в ФН).
     *  Максимальная длина строки – 256 символов
     * @param paymentAddress Адрес места расчетов.
     * @returns self
     */
    this.setPaymentAddress = function (paymentAddress) {

    };
    /**
     * Если чек выдается электронно, то в запросе обязательно должно быть заполнено
     * одно из полей: email или phone.
     * Максимальная длина строки – 64 символа.
     * @param {string} email Электронная почта покупателя
     * @returns self
     */
    this.setEmail = function (email) {

    };
    /**
     * Если чек выдается электронно, то в запросе обязательно должно быть заполнено
     * одно из полей: email или phone.
     * Максимальная длина строки – 64 символа.
     * @param {string} phone Телефон покупателя. Передается без префикса «+7».
     * @returns self
     */
    this.setPhone = function (phone) {

    };
    /**
     * Система налогообложения.
     * Перечисление со значениями: <ul>
     *      <li> «osn» – общая СН;
     * </li><li> «usn_income» – упрощенная СН(доходы);
     * </li><li> «usn_income_outcome» – упрощенная СН (доходы минус расходы);
     * </li><li> «envd» – единый налог на вмененный  доход;
     * </li><li> «esn» – единый сельскохозяйственный  налог;
     * </li><li> «patent» – патентная СН.
     * </li></ul>
     * @param {string} sno  Система налогообложения (см. допустимые значения)
     * @returns self
     */
    this.setSno = function (sno) {

    };
    this.setTotal = function () {

    };

    /**
     * Как будет оплачен
     * @param {number} cash
     * @param {number} [less1=0]
     * @param {number} [less2=0]
     * @param {number} [less3=0]
     */
    this.setPayments = function (cash, less1, less2, less3) {
        data.Cash = cash || 0;
        data.CashLessType1 = less1 || 0;
        data.CashLessType2 = less2 || 0;
        data.CashLessType3 = less3 || 0;
    };

    // --------------------------------------------------------------------------------------------
    // Добавление строк к чеку
    // --------------------------------------------------------------------------------------------
    /**
     * Фискальная строка чека
     * @param {string} name  Название товара
     * @param {number} quantity Количество
     * @param {number} price  цена
     * @param {number} amount сумма
     * @param [tax]  Налогообложение
     * @param [department]  отдел магазина
     * @param {string} [ean13]  штрих код
     *
     *
     */
    this.addRegisterString = function (name, quantity, price, amount, tax, department, ean13) {
        var registerString;

        registerString = {
            Register: {
                Name: name,
                Quantity: quantity,
                Price: price,
                Amount: amount,
                Department: department,
                Tax: tax,
                EAN13: ean13
            }
        };
        data.CheckStrings.push(registerString);

        return registerString.Register;

    };
    /**
     *
     *
     * @param Name
     * @param Quantity
     * @param Price
     * @param Amount
     * @param Tax
     * @param Department
     * @param EAN13
     * @param EGAIS
     */
    this.r = function (Name, Quantity, Price, Amount, Tax, Department, EAN13, EGAIS) {
        self.addRegisterString(Name, Quantity, Price, Amount, Tax, Department, EAN13, EGAIS);
        return self;
    };
    /**
     *
     * @param Text
     * @param Font
     * @param Intensity
     * @return {{Text, Font, Intensity}}
     */
    this.addTextString = function (Text, Font, Intensity) {
        var textString;

        textString = {
            PrintText: {
                Text: Text,
                Font: Font,
                Intensity: Intensity
            }
        };

        data.CheckStrings.push(textString);
        return textString.PrintText;

    };
    /**
     *
     * @param Text
     * @param Font
     * @param Intensity
     * @return {{data: {VerFFD: string, Command: string, numDevice: number, InnKkm: string, KktNumber: string, Timeout: number, IdCommand: (*|string), IsFiscalCheck: boolean, TypeCheck: number, CancelOpenedCheck: boolean, NotPrint: boolean, NumberCopies: number, CashierName: string, ClientAddress: string, TaxVariant: string, CheckProps: Array, AdditionalProps: Array, KPP: string, ClientId: string, KeySubLicensing: string, CheckStrings: Array, Cash: number, CashLessType1: number, CashLessType2: number, CashLessType3: number}, addRegisterString: KkmServer.Check.addRegisterString, r: KkmServer.Check.r, addTextString: KkmServer.Check.addTextString, t: t, addBarcodeString: addBarcodeString, b: b, addImageString: addImageString, i: i, print: print, fiscal: fiscal}}
     */
    this.t = function (Text, Font, Intensity) {
        self.addTextString(Text, Font, Intensity);
        return self;
    };
    /**
     * Добавление печати штрихкода
     *
     * @param {string} BarcodeType "EAN13", "CODE39", "CODE128", "QR", "PDF417"
     * @param {string} Barcode
     * @return {{BarcodeType, Barcode}}
     *
     * @example
     * check.addBarcodeString("EAN13", "1254789547853");
     */
    this.addBarcodeString = function (BarcodeType, Barcode) {
        var barcodeString;
        barcodeString = {
            BarCode: {
                BarcodeType: BarcodeType,
                Barcode: Barcode
            }
        };

        data.CheckStrings.push(barcodeString);
        return barcodeString.BarCode;
    };
    /**
     *
     * @param BarcodeType
     * @param Barcode
     * @return {{data: {VerFFD: string, Command: string, numDevice: number, InnKkm: string, KktNumber: string, Timeout: number, IdCommand: (*|string), IsFiscalCheck: boolean, TypeCheck: number, CancelOpenedCheck: boolean, NotPrint: boolean, NumberCopies: number, CashierName: string, ClientAddress: string, TaxVariant: string, CheckProps: Array, AdditionalProps: Array, KPP: string, ClientId: string, KeySubLicensing: string, CheckStrings: Array, Cash: number, CashLessType1: number, CashLessType2: number, CashLessType3: number}, addRegisterString: KkmServer.Check.addRegisterString, r: KkmServer.Check.r, addTextString: KkmServer.Check.addTextString, t: KkmServer.Check.t, addBarcodeString: KkmServer.Check.addBarcodeString, b: b, addImageString: addImageString, i: i, print: print, fiscal: fiscal}}
     */
    this.b = function (BarcodeType, Barcode) {
        self.addBarcodeString(BarcodeType, Barcode);
        return self;
    };
    /**
     *
     * @param Image
     * @return {{Image}}
     */
    this.addImageString = function (Image) {
        var imageString;

        imageString = {
            PrintImage: {
                Image: Image
            }
        };

        data.CheckStrings.push(imageString);
        return imageString.PrintImage;

    };
    /**
     *
     * @param Image
     * @return {{data: {VerFFD: string, Command: string, numDevice: number, InnKkm: string, KktNumber: string, Timeout: number, IdCommand: (*|string), IsFiscalCheck: boolean, TypeCheck: number, CancelOpenedCheck: boolean, NotPrint: boolean, NumberCopies: number, CashierName: string, ClientAddress: string, TaxVariant: string, CheckProps: Array, AdditionalProps: Array, KPP: string, ClientId: string, KeySubLicensing: string, CheckStrings: Array, Cash: number, CashLessType1: number, CashLessType2: number, CashLessType3: number}, addRegisterString: KkmServer.Check.addRegisterString, r: KkmServer.Check.r, addTextString: KkmServer.Check.addTextString, t: KkmServer.Check.t, addBarcodeString: KkmServer.Check.addBarcodeString, b: KkmServer.Check.b, addImageString: KkmServer.Check.addImageString, i: i, print: print, fiscal: fiscal}}
     */
    this.i = function (Image) {
        self.addImageString(Image);
        return self;
    };
    /**
     * @return self
     */
    this.print = function () {
        data.IsFiscalCheck = false;
        return kkm.execute(data);
    };
    /**
     *
     * @return self
     */
    this.fiscal = function () {
        data.IsFiscalCheck = true;
        return kkm.execute(data);
    };
}





