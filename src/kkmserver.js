/**
 * @fileOverview Js-библиотека для взаимодействия со специальным сервером, посредством  Ajax запросов.
 * Дополнительные библиотеки не требуются.<br />
 *
 * @author Oleg Muraveyko
 * @version 0.1.0
 *
 * @see Source code on Github  {@link https://github.com/Muraveiko/kkmserver}
 * @see Server API part by Dmitriy Garbuz  {@link https://kkmserver.ru/KkmServer}
 *
 */

if (!window.KkmServer) {
    /**
     * window.KkmServer -  Синглетон для работы с фискальными регистраторами, подключенными к  KkmServer.
     */


    /**
     *  Устройство [0-9], где 0 - первое свободное
     *  @memberOf KkmServer
     *  @typedef  NumDevice
     *  @type {number}
     */

    /**
     *  Базовая структура для передачи команды серверу API
     *
     *  @memberOf KkmServer
     *  @typedef  CommandKkm
     *  @type {object}
     *  @property {string} Command    Имя команды
     *  @property {KkmServer.NumDevice} numDevice  Устройство
     *  @property {string} IdCommand  Идентификатор команды для возможности последующего запроса о ее выполнении
     *
     */
    
    /**
     *  Структура для передачи команды серверу API с фамилией кассира
     *
     *  @memberOf KkmServer
     *  @typedef CommandKkmWithCashier
     *  @type {KkmServer.CommandKkm}
     *  @property  {string}  CashierName   имя кассира
     */

    /**
     * Структура для передачи команды серверу API с фамилией кассира и суммой операции
     *
     *  @memberOf KkmServer
     *  @typedef CommandKkmWithAmount
     *  @type {KkmServer.CommandKkmWithCashier}
     *  @property  {number}  Amount   Сумма
     */
    
    (function () {
        /**
         *  Синглетон для работы с фискальными регистраторами, подключенными к  KkmServer
         *  @global
         *  @namespace
         */
        this.KkmServer = {

            default: {
                numDevice: 0,
                CashierName: '',
                InnKkm: ''
            },
            funSuccess: null,
            funError: function (xhr, status) {
                var response = {
                    Status: 2,
                    Error: "Request failed: " + status
                };
                $.funSuccess(response);
            },
            urlServer: 'http://localhost:5893/',
            auth: '',
            timeout: 60000, //Минута - некоторые драйверы при работе выполняют интерактивные действия с пользователем - тогда увеличте тайм-аут
            /**  @type {CommandKkm|CommandKkmWithCashier|CommandKkmWithAmount|null} */
            lastCommand: null,
            /**
             *  Параметры подключения
             *
             * @param {string} user Имя пользователя
             * @param {string} password Пароль
             * @param {string} [urlServer] Адрес сервера
             * @return this;
             *
             */
            connect: function (user, password, urlServer) {
                if (undefined !== urlServer) {
                    $.urlServer = urlServer;
                }
                if (undefined !== password || undefined !== user) {
                    $.auth = "Basic " + btoa(user + ":" + password);
                }
                return $;
            },
            /**
             * Передача команды серверу .
             * @param  {CommandKkm|CommandKkmWithCashier|CommandKkmWithAmount} data Структура для передачи серверу
             *
             */
            execute: function (data) {
                var json = $.toJSON(data);
                var r = new XMLHttpRequest();
                r.open("POST", $.urlServer + 'Execute/sync', true);
                r.responseType = 'json';
                r.setRequestHeader("Authorization", $.auth);
                r.onload = function () {
                    $.funSuccess(r.response);
                };
                r.onerror = function () {
                    $.funError(r, 'ajax error');
                };
                $.lastCommand = data;
                r.send(json);
            },

            // -------------------------------------------------------
            //  Хуки на обработку результата ajax запроса
            // -------------------------------------------------------
            /**
             *  Обработчик успешного запроса к серверу
             *
             * @param {function} funSuccess  callback
             * @return this
             */
            setHookAjaxSuccess: function (funSuccess) {
                $.funSuccess = funSuccess;
                return $;
            },
            /**
             *  Обработчик ошибки запроса
             *
             * @param {function} funError callback
             * @return this
             */
            setHookAjaxFail: function (funError) {
                $.funError = funError;
                return $;
            },

            // -------------------------------------------------------
            //  Сеттеры
            // -------------------------------------------------------

            /**
             * Номер Устройства по умолчанию
             * @param {KkmServer.NumDevice} numDevice целое 0-9
             * @returns this
             *
             */
            setNumDevice: function (numDevice) {
                $.default.numDevice = numDevice;
                return $;
            },
            /**
             * Кассир по умолчанию
             * @param {string} CashierName ФИО
             * @returns this
             */
            setCashierName: function (CashierName) {
                $.default.CashierName = CashierName;
                return $;
            },
            /**
             * Инн кассы чтобы чек не ушел неправильно
             * @param {string} InnKkm
             * @return this
             */
            setInnKkm: function (InnKkm) {
                $.default.InnKkm = InnKkm;
                return $;
            },
            // --------------------------------------------------------------------------------------------
            //  Базовые конструкторы команд
            // --------------------------------------------------------------------------------------------
            /**
             * Подготовка структуры запроса к серверу
             * @param {string} Command Имя команды
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkm}
             * @constructor
             */
            CommandKkm: function (Command, numDevice) {
                numDevice = numDevice || $.default.numDevice;

                return {
                    Command: Command,
                    NumDevice: numDevice,
                    IdCommand: $._generateCommandId()
                };
            },
            /**
             * Подготовка структуры запроса к серверу c ФИО кассира
             *
             * @param {string} Command Имя команды
             * @param {string} [CashierName] ФИО Кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithCashier}
             * @constructor
             */
            CommandKkmWithCashier: function (Command, CashierName, numDevice) {
                CashierName = CashierName || $.default.CashierName;

                var Data = $.CommandKkm(Command, numDevice);
                Data.CashierName = CashierName;

                return Data;
            },
            /**
             * Подготовка структуры запроса к серверу c суммой операции
             *
             * @param {string} Command Имя команды
             * @param {number} Amount Сумма
             * @param {string} [CashierName] ФИО Кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithAmount}
             * @constructor
             */
            CommandKkmWithAmount: function (Command, Amount, CashierName, numDevice) {
                CashierName = CashierName || $.default.CashierName;

                var Data = $.CommandKkmWithCashier(Command, CashierName, numDevice);
                Data.Amount = Amount;

                return Data;
            },
            // -------------------------------------------------------
            //  Конструкторы команд
            // -------------------------------------------------------

            /**
             * Команда Внесение денег в кассу
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithAmount}
             * @constructor
             */
            CommandDepositingCash: function (Amount, CashierName, numDevice) {
                return $.CommandKkmWithAmount('DepositingCash', Amount, CashierName, numDevice);
            },
            /**
             * Команда Получение данных KKT
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkm}
             * @constructor
             */
            CommandGetDataKKT: function (numDevice) {
                return $.CommandKkm("GetDataKKT", numDevice);
            },
            /**
             * Команда Запрос результата выполнения команды
             * @param {string} [IdCommand]
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkm}
             * @constructor
             */
            CommandGetRezult: function (IdCommand, numDevice) {
                if (undefined === IdCommand) {
                    IdCommand = $.lastCommand.IdCommand;
                }
                if (undefined === numDevice) {
                    numDevice = $.lastCommand.numDevice;
                }
                var data = $.CommandKkm("GetRezult", numDevice);
                data.IdCommand = IdCommand;
                return data;
            },
            /**
             * Команда Список ККТ подключенных к серверу
             * @returns {{
             *      Command: string,
             *      numDevice: number,
             *      IdCommand: string,
             *      InnKkm: string,
             *      Active: (null|boolean),
             *      OnOff: (null|boolean),
             *      OFD_Error: (null|boolean),
             *      OFD_DateErrorDoc: string,
             *      FN_DateEnd: string,
             *      FN_MemOverflowl: (null|boolean),
             *      FN_IsFiscal: (null|boolean)
             * }}
             * @constructor
             */
            CommandList: function () {

                return {
                    Command: "List",
                    numDevice: 0,
                    IdCommand: $._generateCommandId(),
                    InnKkm: "",
                    Active: null,
                    OnOff: null,
                    OFD_Error: null,
                    OFD_DateErrorDoc: '2100-01-01T00:00:00',
                    FN_DateEnd: '2100-01-01T00:00:00',
                    FN_MemOverflowl: null,
                    FN_IsFiscal: null
                };

            },
            /**
             * Команда Выемка наличных
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithAmount}
             * @constructor
             */
            CommandPaymentCash: function (Amount, CashierName, numDevice) {
                return $.CommandKkmWithAmount('PaymentCash', Amount, CashierName, numDevice);
            },
            /**
             * Команда Печать состояния обмена с ОФД
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkm}
             * @constructor
             */
            CommandOfdReport: function (numDevice) {
                return $.CommandKkm("OfdReport", numDevice);
            },
            /**
             * Команда Открыть денежный ящик
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkm}
             * @constructor
             */
            CommandOpenCashDrawer: function (numDevice) {
                return $.CommandKkm("OpenCashDrawer", numDevice);
            },
            /**
             * Команда Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithCashier}
             * @constructor
             */
            CommandOpenShift: function (CashierName, numDevice) {
                return $.CommandKkmWithCashier('OpenShift', CashierName, numDevice);
            },
            /**
             * Команда Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithCashier}
             * @constructor
             */
            CommandXReport: function (CashierName, numDevice) {
                return $.CommandKkmWithCashier('XReport', numDevice);
            },
            /**
             * Команда Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             * @returns {KkmServer.CommandKkmWithCashier}
             * @constructor
             */
            CommandZReport: function (CashierName, numDevice) {
                return $.CommandKkmWithCashier('ZReport', CashierName, numDevice);
            },

            // -------------------------------------------------------
            //  Выполнение команд на сервере
            // -------------------------------------------------------

            /**
             * Внесение денег в кассу
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            depositingCash: function (Amount, CashierName, numDevice) {
                $.execute($.CommandDepositingCash(Amount, CashierName, numDevice));
            },
            /**
             * Получение данных KKT
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            getDataKKT: function (numDevice) {
                $.execute($.CommandGetDataKKT(numDevice));
            },
            /**
             * Список ККТ подключенных к серверу
             */
            getList: function () {
                $.execute($.CommandList());
            },
            /**
             * Запрос результата выполнения команды
             * @param {string} [IdCommand]
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            getRezult: function (IdCommand, numDevice) {
                $.execute($.CommandGetRezult(IdCommand, numDevice));
            },
            /**
             * Выемка наличных
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            paymentCash: function (Amount, CashierName, numDevice) {
                $.execute($.CommandPaymentCash(Amount, CashierName, numDevice));
            },
            /**
             * Печать состояния обмена с ОФД
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            printOfdReport: function (numDevice) {
                $.execute($.CommandOfdReport(numDevice));
            },
            /**
             * Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            printXReport: function (CashierName, numDevice) {
                $.execute($.CommandXReport(CashierName, numDevice));
            },
            /**
             * Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            printZReport: function (CashierName, numDevice) {
                $.execute($.CommandZReport(CashierName, numDevice));
            },
            /**
             * Открыть денежный ящик
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            openCashDrawer: function (numDevice) {
                $.execute($.CommandOpenCashDrawer(numDevice));
            },
            /**
             * Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {KkmServer.NumDevice} [numDevice] устройство
             */
            openShift: function (CashierName, numDevice) {
                $.execute($.CommandOpenShift(CashierName, numDevice));
            },

            // --------------------------------------------------------------------------------------------
            // Служебное
            // --------------------------------------------------------------------------------------------

            /**
             * Внутрений метод.
             * Советую для регистрации чеков формировать idCommand самостоятельно
             * @returns {string}
             * @private
             */
            _generateCommandId: function () {
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                }

                return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
            },

            // ------------------------------------------------------------------------------------
            //  Работа с чеком
            // -------------------------------------------------------------------------------------

            /**
             * Тип чека: <pre>
             *  0 – продажа;                             10 – покупка;
             *  1 – возврат продажи;                     11 - возврат покупки;
             *  8 - продажа только по ЕГАИС (обычный чек ККМ не печатается)
             *  9 - возврат продажи только по ЕГАИС (обычный чек ККМ не печатается)
             * </pre>
             *  @memberOf KkmServer
             *  @typedef  TypeCheck
             *  @type {number}
             */

            /**
             *  Данные для ЕГАИС системы
             *  @memberOf KkmServer
             *  @typedef  EGAIS
             *  @type {object}
             *  @property  {string} Barcode
             *  @property {string} Ean
             *  @property {number} Volume
             */

            /**
             *  Класс для работы с чеком
             * @param {KkmServer.TypeCheck} [typeCheck]
             * @param {string} [CashierName]
             * @param {string} [InnKkm]
             * @param {number} [numDevice]
             * @class
             */
            Check: function (typeCheck, CashierName, InnKkm, numDevice) {

                typeCheck = typeCheck || 0; // продажа
                numDevice = numDevice || $.default.numDevice;
                InnKkm = InnKkm || $.default.InnKkm;
                CashierName = CashierName || $.default.CashierName;

                var self = this;
                this.data = {
                    VerFFD: "1.0",
                    Command: "RegisterCheck",
                    numDevice: numDevice,
                    InnKkm: InnKkm,
                    KktNumber: "",
                    Timeout: 30,
                    IdCommand: $._generateCommandId(),
                    IsFiscalCheck: true,
                    TypeCheck: typeCheck,
                    CancelOpenedCheck: true,
                    NotPrint: false,
                    NumberCopies: 0,
                    CashierName: CashierName,
                    ClientAddress: "",
                    TaxVariant: "",
                    CheckProps: [],
                    AdditionalProps: [],
                    KPP: "",
                    ClientId: "",
                    KeySubLicensing: "",
                    CheckStrings: [],
                    Cash: 0,
                    CashLessType1: 0,
                    CashLessType2: 0,
                    CashLessType3: 0
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
                 * @param {KkmServer.EGAIS} [egais]
                 *
                 *
                 */
                this.addRegisterString = function (name, quantity, price, amount, tax, department, ean13, egais) {
                    var registerString;

                    registerString = {
                        Register: {
                            Name: name,
                            Quantity: quantity,
                            Price: price,
                            Amount: amount,
                            Department: department,
                            Tax: tax,
                            EAN13: ean13,
                            EGAIS: egais
                        }
                    };
                    self.data.CheckStrings.push(registerString);

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

                    self.data.CheckStrings.push(textString);
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

                    self.data.CheckStrings.push(barcodeString);
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

                    self.data.CheckStrings.push(Data);
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
                 *
                 */
                this.print = function () {
                    self.data.IsFiscalCheck = false;
                    $.execute(self.data);
                };
                /**
                 *
                 */
                this.fiscal = function () {
                    self.data.IsFiscalCheck = true;
                    $.execute(self.data);
                };
            }

        };
        var $ = this.KkmServer;


    }).apply(window);


//  --------------------------------------------------------------------------------------------

    /**
     импорт сторонней функции toJson
     @see code.google.com/p/jquery-json
     **/
    (function ($) {
        'use strict';
        var escape = /["\\\x00-\x1f\x7f-\x9f]/g,
            meta = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\'},
            hasOwn = Object.prototype.hasOwnProperty;
        $.toJSON = typeof JSON === 'object' && JSON.stringify ? JSON.stringify : function (o) {
            if (o === null) {
                return 'null';
            }
            var pairs, k, name, val, type = $.type(o);
            if (type === 'undefined') {
                return undefined;
            }
            if (type === 'number' || type === 'boolean') {
                return String(o);
            }
            if (type === 'string') {
                return $.quoteString(o);
            }
            if (typeof o.toJSON === 'function') {
                return $.toJSON(o.toJSON());
            }
            if (type === 'date') {
                var month = o.getUTCMonth() + 1, day = o.getUTCDate(), year = o.getUTCFullYear(),
                    hours = o.getUTCHours(), minutes = o.getUTCMinutes(), seconds = o.getUTCSeconds(),
                    milli = o.getUTCMilliseconds();
                if (month < 10) {
                    month = '0' + month;
                }
                if (day < 10) {
                    day = '0' + day;
                }
                if (hours < 10) {
                    hours = '0' + hours;
                }
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                if (seconds < 10) {
                    seconds = '0' + seconds;
                }
                if (milli < 100) {
                    milli = '0' + milli;
                }
                if (milli < 10) {
                    milli = '0' + milli;
                }
                return '"' + year + '-' + month + '-' + day + 'T' +
                    hours + ':' + minutes + ':' + seconds + '.' + milli + 'Z"';
            }
            pairs = [];
            if ($.isArray(o)) {
                for (k = 0; k < o.length; k++) {
                    pairs.push($.toJSON(o[k]) || 'null');
                }
                return '[' + pairs.join(',') + ']';
            }
            if (typeof o === 'object') {
                for (k in o) {
                    if (hasOwn.call(o, k)) {
                        type = typeof k;
                        if (type === 'number') {
                            name = '"' + k + '"';
                        } else if (type === 'string') {
                            name = $.quoteString(k);
                        } else {
                            continue;
                        }
                        type = typeof o[k];
                        if (type !== 'function' && type !== 'undefined') {
                            val = $.toJSON(o[k]);
                            pairs.push(name + ':' + val);
                        }
                    }
                }
                return '{' + pairs.join(',') + '}';
            }
        };
        $.evalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
            return eval('(' + str + ')');
        };
        $.secureEvalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
            var filtered = str.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
            if (/^[\],:{}\s]*$/.test(filtered)) {
                return eval('(' + str + ')');
            }
            throw new SyntaxError('Error parsing JSON, source is not valid.');
        };
        $.quoteString = function (str) {
            if (str.match(escape)) {
                return '"' + str.replace(escape, function (a) {
                        var c = meta[a];
                        if (typeof c === 'string') {
                            return c;
                        }
                        c = a.charCodeAt();
                        return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
                    }) + '"';
            }
            return '"' + str + '"';
        };

    })(KkmServer);
}
