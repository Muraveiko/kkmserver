/**
 * @file Js-библиотека для взаимодействия со специальным сервером, посредством  Ajax запросов.
 * Дополнительные библиотеки не требуются.<br />
 *
 * @author Oleg Muraveyko
 * @version 0.2.0
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
     * необходимые реализованы как методы CommandXXX {@link KkmServer}.<br/>
     * Если Вам потребуется не реализованная команда апи LineLength, то ее можно
     * объявить явно.
     * @type {string}
     *
     * @example
     * kkm.execute(new KkmCommand('LineLength'));
     */
    this.Command = command;
    /**
     * Номер устройства 0-9 по умолчанию 0 - первое свободное
     * @type {number|null}
     * @see {@link KkmServer#setNumDevice}
     */
    this.NumDevice = numDevice || null;
    /**
     *  Любая строока из 40 символов
     *  По этому идентификатору можно запросить результат выполнения команды.
     *  Поле не обязательно
     *
     *  @summary Уникальный идентификатор команды
     *  @type {string}
     *  @see {@link KkmServer#setIdCommand}
     */
    this.IdCommand = '';
    /**
     * Kлюч суб-лицензии
     * @type {string}
     * @see {@link KkmServer#setKeySubLicensing}
     */
    this.KeySubLicensing = '';

    /**
     * ИНН ККМ. Если "" то ККМ ищется только по NumDevice, <br />
     * Если NumDevice = 0 а InnKkm заполнено то ККМ ищется только по InnKkm
     * @type {string}
     * @see {@link KkmServer#setInnKkm}
     * @see {@link KkmCheck#setInnKkm}
     */
    this.InnKkm = '';
    /**
     * Заводской номер ККМ для поиска. Если "" то ККМ ищется только по NumDevice
     * @type {string}
     *
     * @see {@link KkmServer.setKktNumber}
     */
    this.KktNumber = '';
    /**
     * Если За это время команда не выполнилась в статусе вернется результат "NotRun" или "Run" <br />
     * Проверить результат еще не выполненной команды можно командой "GetRezult" <br />
     * Если не указано или 0 - то значение по умолчанию 60 сек.<br />
     * Это поле можно указвать во всех командах
     * @summary Время (сек) ожидания выполнения команды.
     * @type {number}
     */
    this.Timeout = 60;

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
 * Информация об одном устройстве в списке подключенных
 * @class
 *
 * @property  {number} NumDevice Номер [1-9] устройства на сервере
 * @property  {string} IdDevice Уникальный ид, присвоенный сервером
 * @property  {boolean} OnOff Включено
 * @property  {boolean} Active Активно
 * @property  {string} TypeDevice
 * @property  {string} IdTypeDevice
 * @property  {string} IP - Если подключено по сети
 * @property  {string} NameDevice
 * @property  {string} UnitName
 * @property {string} KktNumber - Заводской номер кассового аппарата
 * @property {string} INN - ИНН организации
 * @property {string} NameOrganization - Наименование организации
 * @property {number} TaxVariant - При нескольких СНО через запятую, например: "0,3,5"
 * @property {string} AddDate - Когда добавлено на сервере
 * @property {string} OFD_Error - Если не пусто, то сообщение об ошибке обмена с ОФД
 * @property {number} OFD_NumErrorDoc - Количество не переданных документов в ОФД
 * @property {string} OFD_DateErrorDoc - Дата первого не переданного документа в ОФД
 * @property {string} FN_DateEnd - Когда нужно менять фискальный накопитель
 * @property {boolean} FN_MemOverflowl - Приближается переполнение фискального накопителя
 * @property {boolean} FN_IsFiscal - Кассовый принтер или фискальный аппарат
 * @property {boolean} PaperOver - Закончилась бумага
 *
 * @see {@link KkmServer#CommandList}
 * @see {@link KkmServer#doGetList}
 */
function KkmUnit(){

}

/**
 *  Ответ API
 * <p> Здесь перечислены все возможные свойства, которые могут присутствувать в ответе. Командно-зависимые описаны как property </p>
 * @class
 *
 * @property {string} [URL] URL проверки чека <br />
 *              t=20170115T154700&s=0.01&fn=99078900002287&i=118&fp=549164494&n=1  <br />где: <br />
 *              t-дата-время, s-сумма документа, fn-номер ФН, i-номер документа, fp-фискальная подпись, n-тип документа
 * @property {number} [CheckNumber] Номер документа
 * @property {number} [SessionNumber] Номер смены
 * @property  {object} [Info] состояние Ккт
 * @property  {string} Info.UrlServerOfd  - URL или IP сервера ОФД
 * @property  {number} Info.PortServerOfd - IP-порт сервера ОФД
 * @property  {string} Info.NameOFD - Наименование ОФД
 * @property  {string} Info.UrlOfd  - префикс URL ОФД для поиска чека
 * @property  {string} Info.InnOfd - ИНН ОФД
 * @property  {boolean} Info.EncryptionMode - Шифрование
 * @property  {boolean} Info.OfflineMode  - Автономный режим
 * @property  {boolean} Info.AutomaticMode - Автоматический режим
 * @property  {boolean} Info.InternetMode - Расчеты в Интернете
 * @property  {boolean} Info.BSOMode - Бланки строгой отчетности
 * @property  {boolean} Info.ServiceMode - Применение в сфере услуг
 * @property  {string} Info.InnOrganization - ИНН организации
 * @property  {string} Info.NameOrganization - Наименование организации
 * @property  {string} Info.AddressSettle - Адрес установки ККМ
 * @property  {string|number} Info.TaxVariant - При нескольких СНО через запятую, например: "0,3,5"
 * @property  {string} Info.KktNumber - Заводской номер кассового аппарата
 * @property  {string} Info.FnNumber - Заводской номер фискального регистратора
 * @property  {string} Info.RegNumber - Регистрационный номер ККТ (из налоговой)
 * @property  {boolean} Info.OnOff - выключена-включенна
 * @property  {boolean} Info.Active - автивна/неактивна (на связи)
 * @property  {string} Info.Command - ????
 * @property  {boolean} Info.FN_IsFiscal - Кассовый принтер или фискальный аппарат
 * @property  {boolean} Info.FN_MemOverflowl - Приближается переполнение фискального накопителя
 * @property  {string} Info.FN_DateEnd - Когда нужно менять фискальный накопитель
 * @property  {string} Info.OFD_Error  - Если не пусто, то сообщение об ошибке обмена с ОФД
 * @property  {number} Info.OFD_NumErrorDoc -  Количество не переданных документов в ОФД
 * @property  {string} Info.OFD_DateErrorDoc - Дата первого не переданного документа в ОФД
 * @property  {number} Info.SessionState - Статус сессии 1-Закрыта, 2-Открыта, 3-Открыта, но закончилась (3 статус на старых ККМ может быть не опознан)
 * @property  {string} Info.FFDVersion
 * @property  {string} Info.FFDVersionFN
 * @property  {string} Info.FFDVersionKKT
 * @property  {boolean} Info.PaperOver -Закончилась бумага
 * @property  {number} Info.BalanceCash - Остаток наличных
 * @property  {string} Info.LessType1 - Название 1 типа безналичных расчетов
 * @property  {string} Info.LessType2 - Название 2 типа безналичных расчетов
 * @property  {string} Info.LessType3 - Название 3 типа безналичных расчетов
 * @property  {string} Info.LicenseExpirationDate
 * @property {KkmResponse} [Rezult] - ответ на запрос о выполнении команды
 * @property {KkmUnit[]} [ListUnit] Список подключенных устройств
 */
function KkmResponse(Command, IdCommand, Status, Error) {
    /**
     * Status Статус исполнения
     * <ul><li>Ok = 0,</li><li>Run(Запущено на выполнение) = 1,</li><li>Error = 2,</li>
     * <li>NotFound(устройство не найдено) = 3,</li><li>NotRun = 4</ul>
     * @type {number}
     */
    this.Status = Status || 0;
    /**
     * Пустая строка или текст ошибки
     * @type {string}
     */
    this.Error = Error || '';
    /**
     * Команда апи {@link KkmCommand#Command}
     * @type {string}
     */
    this.Command = Command || '';
    /**
     * Уникальный идентификатор комманды, назначенный вами или присвоенный сервером.
     * @type {string}
     */
    this.IdCommand = IdCommand || '';

    /**
     *  Номер устройства выполневшего команду
     * @type {number}
     */
    this.NumDevice = 0;

    /**
     * Название устройства
     * @type {string}
     */
    this.UnitName = '';

}

/**
 * Эмуляция сообщение об ошибке от API <br />
 * используется во встроенном обработчике ошибки ajax запроса
 * @param errMessage
 * @class
 * @extends KkmResponse
 * @see {@link KkmServer#hookAjaxFail}
 */
function KkmResponseError(errMessage) {
    KkmResponse.call(this, '', '', 2, errMessage);
}
/**
 * Описание интерфейса для функции обратного вызова
 * @callback  KkmServer~KkmApiСallback
 * @param {KkmResponse} ответ от АПИ
 * @see [установка хука]{@link KkmServer#hookAjaxSuccess}
 */


/**
 * @summary Класс для взаимодействия с API
 * @description Методы класса можно разделить на группы
 *  <h6>Внутренние:</h6>
 *  <ul><li><b>funXxx</b> - встроенные обработчики AJAX</li></ul>
 *  <h6>Публичные:</h6>
 *  <ul><li><b>[CommandXxx]{@link KkmServer#CommandDepositingCash}</b> - возвращают структуру данных для передачи серверу, которую можно модифицировать</li>
 *  <li><b>[doXxx]{@link KkmServer#doDepositingCash}</b> - выполняют сразу нужную операцию</li>
 *  <li><b>[hookXxx]{@link KkmServer#hookAjaxFail}</b> - установить свои обработчики для AJAX</li>
 *  <li><b>[setXxx]{@link KkmServer#setCashierName}</b> - устанавливают параметры по умолчанию для команд</li>
 *  <li><b>[execute]{@link KkmServer#execute}</b> - посылает ajax запрос серверу с тонкой настройкой</li>
 *  </ul><h6>Через посредника:</h6><ul>
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
 * var kkm = new KkmServer('Admin', '','http://localhost:5893/').hookAjaxSuccess(ExecuteSuccess);
 * kkm.doOpenShift();
 */
function KkmServer(user, password, urlServer) {
    var self = this;

    urlServer = urlServer || 'http://localhost:5893/';


    var defaults = {
        numDevice: 0,
        cashierName: '',
        innKkm: '',
        kktNumber: '',
        keySubLicensing: ''
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

    /**
     * Последняя посланная серверу команда. Только для отладки.
     * @type {*}
     */
    this.lastCommand = null;

    /**
     * Передача команды серверу .
     * @param  {KkmCommand|KkmCommandWithCashier|KkmCommandWithAmount|KkmCommandList|KkmCommandCheck} command Структура для передачи серверу
     * @param [successHook] по умолчанию обработчик объявленый через hookAjaxSuccess
     * @param [errorHook]  по умолчанию обработчик объявленый через hookAjaxFail
     * @returns {KkmCommand|KkmCommandWithCashier|KkmCommandWithAmount|KkmCommandList|KkmCommandCheck}
     */
    this.execute = function (command, successHook, errorHook) {

        if (undefined === successHook) {
            successHook = funSuccess;
        }
        if (undefined === errorHook) {
            errorHook = funError;
        }

        // внедряем значения по умолчанию
        if (undefined !== command && command.Command) { // If it looks like a duck (KkmCommand)
            command.KeySubLicensing = defaults.keySubLicensing;
            if (null === command.NumDevice) {
                command.NumDevice = defaults.numDevice;
            }
            if ('' === command.IdCommand) {
                command.IdCommand = generateCommandId();
            }
            if (null === command.CashierName) { // If it looks like a duck (KkmCommandWithCashier)
                command.CashierName = defaults.cashierName;
            }
            if ('' === command.InnKkm) {
                command.InnKkm = defaults.innKkm;
            }
            if ('' === command.KktNumber) {
                command.KktNumber = defaults.kktNumber;
            }
        } else {
            throw Error('Апи передана неправильная структура');
        }
        // сохраняем
        self.lastCommand = command;

        var json = JSON.stringify(command);

        // готовим ajax запрос
        var r = new XMLHttpRequest();
        r.open("POST", connection.urlServer + 'Execute/sync', true);
        r.responseType = 'json';
        r.setRequestHeader("Authorization", connection.auth);
        r.onload = function () {
            var json = r.response;
            // костыль для IE11
            if ('string' === typeof(json)) {
                json = JSON.parse(/** @type string */json);
            }
            successHook(json);
        };
        r.onerror = function () {
            errorHook(r, 'ajax error');
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
     * @see назначить свой {@link hookAjaxSuccess}
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
     * @see назначить свой {@link hookAjaxFail}
     */
    var funError = function (xhr, status) {

        var response = new KkmResponseError("Request failed: " + status);
        response.Command = self.lastCommand.Command;
        response.IdCommand = self.lastCommand.IdCommand;

        funSuccess(response);
    };


    // -------------------------------------------------------
    //  Хуки на обработку результата ajax запроса
    // -------------------------------------------------------

    /**
     *  Назначить обработчик успешного запроса к серверу по умолчанию
     *
     * @param {KkmServer~KkmApiСallback} successHook функция обработчик
     * @returns {KkmServer}
     * @see исходный код funSuccess
     */
    this.hookAjaxSuccess = function (successHook) {
        funSuccess = successHook;
        return self;
    };

    /**
     *  Назначить обработчик ошибки запроса
     *
     * @param {funError} errorHook callback
     * @returns {KkmServer}
     * @see  исходный код  funError
     */
    this.hookAjaxFail = function (errorHook) {
        funError = errorHook;
        return self;
    };


    // -------------------------------------------------------
    //  Сеттеры
    // -------------------------------------------------------
    /**
     * СубЛицензия
     * @param {string} key
     * @returns {KkmServer}
     */
    this.setKeySubLicensing = function (key) {
        defaults.keySubLicensing = key;
        return self;
    };

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
     * Инн кассы по умолчанию (для исполнения команды ищется ккт,
     * зарегистрированная на этот инн)
     * @param {string} innKkm
     * @returns {KkmServer}
     */
    this.setInnKkm = function (innKkm) {
        defaults.innKkm = innKkm;
        return self;
    };

    /**
     * Для исполнения команды будет использована ккт с этим заводским номером
     * @param {string} kktNumber
     * @returns {KkmServer}
     */
    this.setKktNumber = function(kktNumber) {
        defaults.kktNumber = kktNumber;
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
        if (undefined === idCommand) {
            idCommand = self.lastCommand.IdCommand;
        }
        if (undefined === numDevice) {
            numDevice = self.lastCommand.NumDevice;
        }
        var data = new KkmCommand("GetRezult", numDevice);
        data.IdCommand = idCommand;
        return data;
    };

    /**
     * Команда Список подключенных устройств
     * @returns {KkmCommandList}
     * @see [элемент массива ListUnit в ответе сервера]{@link KkmUnit}
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
     * @param {string} [idCommand]
     * @param {number} [numDevice] устройство
     * @returns {KkmCommand}
     */
    this.doGetRezult = function (idCommand, numDevice) {
        return self.execute(self.CommandGetRezult(idCommand, numDevice));
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

}


// ------------------------------------------------------------------------------------
//  Работа с чеком
// -------------------------------------------------------------------------------------
/**
 * Структура запроса к апи для работы с чеком <br/>
 * советую использовать [обертку над командой]{@link KkmCheck}
 * @param {number} [typeCheck=0] Тип чека
 * @class
 * @extends {KkmCommand}
 * @see {@link KkmCheck}
 */
function KkmCommandCheck(typeCheck) {
    KkmCommand.call(this, 'RegisterCheck');
    this.VerFFD = "1.0";
    /**
     *  Это фискальный или не фискальный чек <br/>
     *  При работе через KkmCheck устанавливается автоматически при вызове методов fiscalXxx(),
     *  print() в нужное значение
     * @type {boolean}
     */
    this.IsFiscalCheck = false;
    /**
     * Тип чека :
     * <pre>
     *  0 – продажа;                             10 – покупка;
     *  1 – возврат продажи;                     11 - возврат покупки;
     *  Для новых ККМ:
     *  2 – корректировка продажи;               12 - корректировка покупки
     *  3 – корректировка возврата продажи;      13 - корректировка возврата покупки
     * </pre>
     * Значение передается в конструктор класса KkmCheck
     *  @summary Тип чека;
     * @type {number}
     * @default 0
     */
    this.TypeCheck = typeCheck || 0;
    /**
     * Аннулировать открытый чек если ранее чек небыл  завершен до конца (устарело)
     * @type {boolean}
     * @deprecated
     */
    this.CancelOpenedCheck = true;
    /**
     * Не печатать чек на бумагу
     * @type {boolean}
     * @see {@link KkmCheck#fiscalOnly}
     * @see {@link KkmCheck#setNotPrint}
     */
    this.NotPrint = false;
    /**
     * Количество копий документа
     * @type {number}
     * @see {@link KkmCheck#setNumberCopies}
     */
    this.NumberCopies = 0;
    /**
     * Продавец, тег ОФД 1021
     * @type {string}
     * @see {@link KkmCheck#setCashierName}
     * @see {@link KkmServer#setCashierName}
     */
    this.CashierName = '';
    /**
     * Телефон или е-Майл покупателя, тег ОФД 1008 <br />
     * Если чек не печатается (NotPrint = true) то указывать обязательно
     * @type {string}
     * @see {@link KkmCheck#setEmail}
     * @see {@link KkmCheck#setPhone}
     */
    this.ClientAddress = '';
    /**
     * <pre>
     *       Если не указанно - система СНО настроенная в ККМ по умолчанию
     *       0: Общая СНО - ОСН
     *       1: Упрощенная СНО (Доход)
     *       2: Упрощенная СНО(Доход минус Расход)
     *       3: Единый налог на вмененный доход
     *       4: Единый сельскохозяйственный налог
     *       5: Патентная система налогообложения
     *       Комбинация разных СНО не возможна
     * </pre>
     *       Надо указываеть если ККМ настроена на несколько систем СНО
     *
     * @summary Система налогообложения (СНО) применяемая для чека.
     * @type {number}
     * @see {@link KkmCheck#setSno}
     * @see {@link KkmCheck#setTaxVariant}
     */
    this.TaxVariant = 0;
    /**
     * Дополниельные реквизиты чека (не обязательно)
     * @type {Array.<KkmCheckProperty>}
     * @see {@link KkmCheck#addCheckProps}
     */
    this.CheckProps = [];
    /**
     * Дополнительные произвольные реквизиты (не обязательно) пока только 1 строка
     * @type {KkmAdditionalCheckProperty[]}
     * @see {@link KkmCheck#addAdditionalProps}
     */
    this.AdditionalProps = [];
    /**
     * Это только для тестов
     * @type {string}
     */
    this.ClientId = '';
    /**
     * КПП организации, нужно только для ЕГАИС
     * @type {string}
     * @see {@link KkmCheck#setKpp}
     */
    this.KPP = '';
    /**
     * Строки чека
     * @type {Array.<KkmCheckString>}
     * @see {@link KkmCheck#addRegisterString}
     * @see {@link KkmCheck#addTextString}
     * @see {@link KkmCheck#addBarcodeString}
     * @see {@link KkmCheck#addImageString}
     */
    this.CheckStrings = [];
    /**
     * Наличная оплата
     * @type {number}
     * @see {@link KkmCheck#setTotal}
     * @see {@link KkmCheck#setPayments}
     */
    this.Cash = 0;
    /**
     * Безналичная оплата типа 1 (по умолчанию - Оплата картой)
     * @type {number}
     * @see {@link KkmCheck#setTotal}
     * @see {@link KkmCheck#setPayments}
     */
    this.CashLessType1 = 0;
    /**
     * Безналичная оплата типа 2 (по умолчанию - Оплата кредитом)
     * @type {number}
     * @see {@link KkmCheck#setPayments}
     */
    this.CashLessType2 = 0;
    /**
     * Безналичная оплата типа 3 (по умолчанию - Оплата сертификатом)
     * @type {number}
     * @see {@link KkmCheck#setPayments}
     */
    this.CashLessType3 = 0;

}
/**
 * Свойство чека
 * @param {boolean} print - печатать
 * @param {boolean} printInHeader - печатать в шапке
 * @param {number} teg - номер тега
 * @param {string} value - значение тега
 *
 * @constructor
 * @see {@link KkmCheck#addCheckProps}
 */
function KkmCheckProperty(print, printInHeader, teg, value) {
    /**
     * печатать
     * @type {boolean}
     */
    this.Print = print;
    /**
     * печатать в шапке
     * @type {boolean}
     */
    this.PrintInHeader = printInHeader;
    /**
     * Номер тега
     * <ul>
     * <li>1005 Адрес оператора по переводу денежных средств (Строка 100)</li>
     * <li>1016 ИНН оператора по переводу денежных средств (Строка 12)</li>
     * <li>1026 Наименование оператора по переводу денежных средств (Строка 64)</li>
     * <li>1044 Операция банковского агента (Строка 24)</li>
     * <li>1045 Операция банковского субагента (Строка 24)</li>
     * <li>1073 Телефон банковского агента (Строка 19)</li>
     * <li>1074 Телефон платежного агента (Строка 19)</li>
     * <li>1075 Телефона оператора по переводу денежных средств (Строка 19)</li>
     * <li>1082 Телефон банковского субагента (Строка 19)</li>
     * <li>1083 Телефон платежного субагента (Строка 19)</li>
     * <li>1119 Телефон оператора по приему платежей (Строка 19)</li>
     * <li>1117 адрес электронной почты отправителя чека</li>
     * </ul>
     * @type {number}
     */
    this.Teg = teg;
    /**
     * Значение тега
     * @type {string}
     */
    this.Prop = value

}
/**
 * Дополнительное свойство чека
 * @param {boolean} print - печатать
 * @param {boolean} printInHeader - печатать в шапке
 * @param {string} name - название
 * @param {string} value - значение тега
 *
 * @constructor
 * @see {@link KkmCheck#addAdditionalProps}
 */
function KkmAdditionalCheckProperty(print, printInHeader, name, value) {
    /**
     * печатать
     * @type {boolean}
     */
    this.Print = print;
    /**
     * печатать в шапке
     * @type {boolean}
     */
    this.PrintInHeader = printInHeader;
    /**
     * Название
     * @type {string}
     */
    this.NameProp = name;
    /**
     * Значение тега
     * @type {string}
     */
    this.Prop = value

}

/**
 * Общая структура для описания строк чека
 * @constructor
 */
function KkmCheckString() {
    /**
     * текстовая строка
     * @type  {null|{Text: string, Font: number, Intensity: number}}
     * @property {string} Text
     * @property {number} Font
     * @property {number} Intensity
     * @see {@link KkmCheck#addTextString}
     */
    this.PrintText = {
        Text: '',
        Font: 0,
        Intensity: 0
    };
    /**
     * регистрация продажи
     * @type {null|{Name: string, Quantity: number, Price: number, Amount: number, Department: number, Tax: number, EAN13: string, EGAIS: {Barcode: string, Ean: string, Volume: number}}}
     * @property {string} Name
     * @property {number} Quantity
     * @property {number} Price
     * @property {number} Amount
     * @property {number} Department
     * @property {number} Tax
     * @property {string} EAN13
     * @property {object} EGAIS
     * @see {@link KkmCheck#addRegisterString}
     */
    this.Register = {
        Name: '',
        Quantity: 0,
        Price: 0,
        Amount: 0,
        Department: 0,
        Tax: 0,
        EAN13: '',
        EGAIS : {
            Barcode: "",
            Ean: "",
            Volume: 0
        }
    };
    /**
     * штрихкод
     * @type {null|{BarcodeType: string, Barcode: string}}
     * @property  {string} BarcodeType
     * @property  {string} Barcode
     * @see {@link KkmCheck#addBarcodeString}
     */
    this.BarCode = {
        BarcodeType: '',
        Barcode: ''
    };
    /**
     * Картинка
     * @type {null|{Image: string}}
     * @property {string} Image
     * @see {@link KkmCheck#addImageString}
     */
    this.PrintImage = {
        Image: ''
    };
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
 *
 * @example
 * // ранее у Вас должен быть определен
 * // var kkm = new KkmServer(...);
 * var check = new KkmCheck(kkm,0); // 0 - здесь явно указал тип продажа
 * // дальше формируем его
 * check.r(...).t(...).b(...).i(...) // рекомендую использовать шорткаты
 * // или полные варианты addXxxString(), если нужно модифицировать сформированную строку
 *  var goodsWithEgais = check.addRegisterString(...);
 *  goodsWithEgais.EGAIS = {
 *       Barcode: "22N0000154NUCPRZ3R8381461004001003499NKAQ0ZBUVDNV62JQAR69PEV878RO93V",
 *       Ean: "3423290167937",
 *       Volume: 0.7500,
 *   };
 * // и в конце вызываем
 * check.fiscal(); // или .print()
 */
function KkmCheck(kkm, typeCheck) {

    var self = this;

    /**
     * ккм - сервер
     * @type {KkmServer}
     */
    this.kkm = kkm;

    /**
     * Данные для передачи апи
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
     * @returns {KkmCheck}
     */
    this.setInnKkm = function (innKkm) {
        data.InnKkm = innKkm;
        return self;
    };

    /**
     *  Используется для предотвращения ошибочных регистраций
     *  чеков на ККТ зарегистрированных с другим адресом места
     *  расчёта (сравнивается со значением в ФН).
     *  Максимальная длина строки – 256 символов
     * @param paymentAddress Адрес места расчетов.
     * @returns {KkmCheck}
     * @todo попросить реализовать в апи
     */
    this.setPaymentAddress = function (paymentAddress) {
        throw new Error('Метод не реализован');
    };
    /**
     * Если чек выдается электронно, то в запросе обязательно должно быть заполнено
     * одно из полей: email или phone.
     * Максимальная длина строки – 64 символа.
     * @param {string} email Электронная почта покупателя
     * @returns {KkmCheck}
     */
    this.setEmail = function (email) {
        data.ClientAddress = email;
        return self;
    };
    /**
     * Если чек выдается электронно, то в запросе обязательно должно быть заполнено
     * одно из полей: email или phone.
     * Максимальная длина строки – 64 символа.
     * @param {string} phone Телефон покупателя. Передается без префикса «+7».
     * @returns {KkmCheck}
     */
    this.setPhone = function (phone) {
        data.ClientAddress = phone;
        return self;
    };
    /**
     * Система налогообложения.
     * где sno
     * <ul>
     *      <li> 0 | «osn» – общая СН;
     * </li><li> 1 | «usn_income»  – упрощенная СН(доходы);
     * </li><li> 2 | «usn_income_outcome»   – упрощенная СН (доходы минус расходы);
     * </li><li> 3 | «envd»  – единый налог на вмененный  доход;
     * </li><li> 4 | «esn»  – единый сельскохозяйственный  налог;
     * </li><li> 5 | «patent»  – патентная СН.
     * </li></ul>
     *
     * @param {number|string} sno  Система налогообложения (см. {@link KkmCommandCheck#TaxVariant})
     * @returns {KkmCheck}
     *
     * @example
     * check.setSno(0);// check.setSno('osn')
     */
    this.setSno = function (sno) {
        if ('string' === typeof(sno)) {
            data.TaxVariant = ['osn', 'usn_income', 'usn_income_outcome', 'envd', 'esn', 'patent'].indexOf(sno);
        } else if ('number' === typeof(sno)) {
            data.TaxVariant = sno;
        }
        return self;
    };
    /**
     * Синоним к setSno
     * @method
     * @see {@link KkmCheck#setSno}
     */
    this.setTaxVariant = this.setSno;

    /**
     * КПП организации, нужно только для ЕГАИС
     * @param {string} Kpp
     * @returns {KkmCheck}
     */
    this.setKpp = function(Kpp){
        data.KPP = Kpp;
        return self;
    };

    var totalCheck = 0;
    /**
     * Данный метод для явного указания общей суммы товаров в чеке перед вызовом
     * фискализации методами [fiscalCash]{@link KkmCheck#fiscalCash} или [fiscalCard]{@link KkmCheck#fiscalCard}<br/>
     * также сумма накапливается при добавлении строк методом r().<br/>
     * Если оплата наличными, то полученные от покупателя деньги - в чеке будет строка сдача.
     *
     * @summary Сумма продажи
     * @param {number} amount При оплате наличными не менее стоимости товаров
     * @returns {KkmCheck}
     * @see {@link KkmCheck#getTotal}
     */
    this.setTotal = function (amount) {
        totalCheck = amount;
        return self;
    };
    /**
     * Стоимость товаров в чеке, добавленных через метод r() или указанная явно
     * @returns {number}
     * @see {@link KkmCheck#setTotal}
     */
    this.getTotal = function () {
        return totalCheck;
    };

    /**
     * Как будет оплачен . <br>
     * Позволяет оперировать до 3х видов настроенных у кассы безналичных расчетов. <br>
     * см методы фискализации и альтернативное указание суммы
     * @param {number} cash Наличными
     * @param {number} [less1=0] Безналичный тип 1 (по умаолчанию карта)
     * @param {number} [less2=0] Безналичный тип 2
     * @param {number} [less3=0] Безналичный тип 3
     *
     * @see [описание методов оплаты в API]{@link KkmCommandCheck#Cash}
     * @see {@link KkmCheck#fiscal}
     * @see {@link KkmCheck#fiscalCash}
     * @see {@link KkmCheck#fiscalCard}
     * @see {@link KkmCheck#setTotal}
     */
    this.setPayments = function (cash, less1, less2, less3) {
        data.Cash = cash || 0;
        data.CashLessType1 = less1 || 0;
        data.CashLessType2 = less2 || 0;
        data.CashLessType3 = less3 || 0;
        return self;
    };

    /**
     * Добаляет данные по тегам <ul>
     * <li>1005 Адрес оператора по переводу денежных средств (Строка 100)</li>
     * <li>1016 ИНН оператора по переводу денежных средств (Строка 12)</li>
     * <li>1026 Наименование оператора по переводу денежных средств (Строка 64)</li>
     * <li>1044 Операция банковского агента (Строка 24)</li>
     * <li>1045 Операция банковского субагента (Строка 24)</li>
     * <li>1073 Телефон банковского агента (Строка 19)</li>
     * <li>1074 Телефон платежного агента (Строка 19)</li>
     * <li>1075 Телефона оператора по переводу денежных средств (Строка 19)</li>
     * <li>1082 Телефон банковского субагента (Строка 19)</li>
     * <li>1083 Телефон платежного субагента (Строка 19)</li>
     * <li>1119 Телефон оператора по приему платежей (Строка 19)</li>
     * <li>1117 адрес электронной почты отправителя чека</li>
     * </ul>
     *
     * @param {boolean} print - печатать
     * @param {boolean} printInHeader - печатать в шапке
     * @param {number} teg - номер тега
     * @param {string} value - значение тега
     * @returns {KkmCheckProperty}
     */
    this.addCheckProps = function (print, printInHeader, teg, value) {

        var newProp = new KkmCheckProperty(print, printInHeader, teg, value);

        data.CheckProps.push(newProp);
        return newProp;
    };

    /**
     * Дополнительные свойства чека
     *
     * @param {boolean} print - печатать
     * @param {boolean} printInHeader - печатать в шапке
     * @param {string} name - наименование
     * @param {string} value - значение тега
     * @returns {KkmAdditionalCheckProperty}
     */
    this.addAdditionalProps = function (print, printInHeader, name, value) {

        var newProp = new KkmCheckProperty(print, printInHeader, name, value);

        data.AdditionalProps.push(newProp);
        return newProp;
    };

    /**
     * Уникальный идентификатор команды
     * @param {string} idCommand
     * @returns {KkmCheck}
     */
    this.setIdCommand = function (idCommand) {
        data.IdCommand = idCommand;
        return self;
    };
    /**
     * Это фискальный или не фискальный чек
     * @param {boolean} isFiscal
     * @returns {KkmCheck}
     */
    this.setIsFiscalCheck = function (isFiscal) {
        data.IsFiscalCheck = isFiscal;
        return self;
    };
    /**
     * Не печатать чек на бумагу
     * @param {boolean} notPrint
     * @returns {KkmCheck}
     */
    this.setNotPrint = function (notPrint) {
        data.NotPrint = notPrint;
        return self;
    };
    /**
     * Время (сек) ожидания выполнения команды.
     * @param {number} timeout
     * @returns {KkmCheck}
     */
    this.setTimeout = function (timeout) {
        data.Timeout = timeout;
        return self;
    };
    /**
     * Заводской номер ККМ для поиска. Если "" то ККМ ищется только по NumDevice
     * @param {string} kktNumber
     * @returns {KkmCheck}
     */
    this.setKktNumber = function (kktNumber) {
        data.KktNumber = kktNumber;
        return self;
    };
    /**
     * Количество копий документа
     * @param {number} numberCopies
     * @returns {KkmCheck}
     */
    this.setNumberCopies = function (numberCopies) {
        data.NumberCopies = numberCopies;
        return self;
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
     * @param {number} tax  Налогообложение
     * @param {number} [department]  отдел магазина
     * @param {string} [ean13]  штрих код
     *
     * @returns {{Name : string, Quantity : number, Price: number, Amount: number , Department: number, Tax: number, EAN13: string,EGAIS}}
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
        totalCheck = totalCheck + amount;

        return registerString.Register;

    };
    /**
     * Шоркат к addRegisterString. Поддерживает цепочку вызовов.
     *
     * @param {string} name
     * @param {number} quantity
     * @param {number} price
     * @param {number} amount
     * @param {number} tax
     * @param {number} [department]
     * @param {string} [ean13]
     *
     * @returns {KkmCheck}
     * @see [addRegisterString]{@link KkmCheck#addRegisterString}
     */
    this.r = function (name, quantity, price, amount, tax, department, ean13) {
        self.addRegisterString(name, quantity, price, amount, tax, department, ean13);
        return self;
    };

    /**
     *  Добавляем текстовую строку
     *  <ul><li>
     *    <#10#> -  При вставке в текст в середину строки символов "<#10#>" Левая часть строки будет выравнена по левому краю, правая по правому, где 10 - это на сколько меньше станет строка ККТ</li><li>
     *    <#10#>> - При вставке в текст в середину строки символов "<#10#>>" Левая часть строки будет выравнена по правому краю, правая по правому, где 10 - отступ от правого края</li><li>
     *    >#10#<текст - сделать строку на 10 символов уже и отцентрировать текст</li><li>
     *  </li></ul>
     * @param {string} Text текст для вывода с управляющими кодами
     * @param {number} [Font] Шрифт 1-4 , 0 - по настройкам ККМ
     * @param {number} [Intensity] Интесивность 1-15 , 0 - по настройкам ККМ
     * @return {{Text, Font, Intensity}}
     *
     * @example
     * var string4edit =  check.addTextString('ЗАГОЛОВОК');
     * string4edit.Text = '>#0#<' + string4edit.Text; // Добавляем центрирование
     * string4edit.Font=1; // Самый крупный шрифт
     * string4edit.Intensity = 15;

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
     * Шорткат к addTextString. Поддерживает цепочку вызовов.
     * @param {string} Text
     * @param {number} Font
     * @param {number} Intensity
     * @returns {KkmCheck}
     * @see  [addTextString]{@link KkmCheck#addTextString}
     */
    this.t = function (Text, Font, Intensity) {
        self.addTextString(Text, Font, Intensity);
        return self;
    };
    /**
     * Добавление печати штрихкода.
     *
     * @param {string} BarcodeType "EAN13", "CODE39", "CODE128", "QR", "PDF417"
     * @param {string} Barcode Значение
     * @return {{BarcodeType, Barcode}}
     * @see [шорткат b()]{@link KkmCheck#b}
     *
     * @example
     * var barString = check.addBarcodeString("EAN13", "1254789547853");
     * // можно модифицировать сформированную строку
     * barString.BarcodeType = '';
     * barString.Barcode = '';
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
     * Шорткат к addBarcodeString. Поддерживает цепочку вызовов.
     * @param {string} BarcodeType
     * @param {string} Barcode
     *
     * @returns {KkmCheck}
     * @see [addBarcodeString]{@link KkmCheck#addBarcodeString}
     */
    this.b = function (BarcodeType, Barcode) {
        self.addBarcodeString(BarcodeType, Barcode);
        return self;
    };
    /**
     * Строка с печатью картинки
     * @param {string} Image Картинка в Base64. <br/>
     *  Картинка будет преобразована в 2-х цветное изображение - поэтому лучше посылать 2-х цветный bmp
     *
     * @return {{Image}}
     * @see [шорткат i()]{@link KkmCheck#i}
     *
     * @example
     * check.addImageString('').Image = demoImage; // можно модифицировать
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
     * Шорткат к addImageString . Поддерживает цепочку вызовов.
     * @param {string} Image
     * @returns {KkmCheck}
     * @see [addImageString]{@link KkmCheck#addImageString}
     */
    this.i = function (Image) {
        self.addImageString(Image);
        return self;
    };
    /**
     * Печать слип-чека (произвольного документа)
     * @returns {KkmCommandCheck}
     */
    this.print = function () {
        data.IsFiscalCheck = false;
        return self.kkm.execute(data);
    };
    /**
     * Фискализация чека
     * @returns {KkmCommandCheck}
     */
    this.fiscal = function () {
        data.IsFiscalCheck = true;
        return self.kkm.execute(data);
    };
    /**
     * Фискализация наличкой
     * @returns {KkmCommandCheck}
     *
     * @example
     * // это удобнее, так как можно заготовить чек и просто повесить на две кнопки выбор способа оплаты
     * check.r(...).r(...).r(...).setTotal(100); // заранее
     * check.fiscalCash(); // на клик
     * // чем еще разбираться с параметрами setPayments
     * check.setPayments(100,0).fiscal(); // эквивалент
     */
    this.fiscalCash = function () {
        self.setPayments(totalCheck);
        return self.fiscal();
    };
    /**
     * Фискализация оплаты картой
     * @returns {KkmCommandCheck}
     *
     * @example
     * check.setTotal(100).fiscalCard();
     * // эквиваленто
     * check.setPayments(0,100).fiscal();
     */
    this.fiscalCard = function () {
        self.setPayments(0, totalCheck);
        return self.fiscal();
    };
    /**
     * Фискализация чека без печати бумажного
     * <p>требует явного указания типа безналичной оплаты через .setPayments
     * @returns {KkmCommandCheck}
     */
    this.fiscalOnly = function () {
        data.IsFiscalCheck = true;
        data.NotPrint = true;
        return self.kkm.execute(data);
    };

}





