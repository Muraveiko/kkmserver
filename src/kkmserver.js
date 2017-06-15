/**
 * @fileOverview Js-библиотека для взаимодействия со специальным сервером, посредством  Ajax запросов.
 * Дополнительные библиотеки не требуются.<br />
 * window.KkmServer -  Синглетон для работы с фискальными регистраторами, подключенными к  KkmServer.
 * @module KkmServer
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
     *  @typedef {object} CommandKkm
     *  @property {string} Command   Имя команды
     *  @property {number}  NumDevice  Устройство [0-9], где 0 - первое свободное
     *  @property {string}  IdCommand Идентификатор команды для возможности последующего запроса о ее выполнении
     */

    /**
     *  @typedef {object} CommandKkmWithCashier
     *  @property {string} Command   Имя команды
     *  @property {number}  NumDevice  Устройство [0-9], где 0 - первое свободное
     *  @property {string}  IdCommand Идентификатор команды для возможности последующего запроса о ее выполнении
     *  @property  {string}  CashierName   имя кассира
     */

    /**
     *  @typedef {object} CommandKkmWithAmount
     *  @property {string} Command   Имя команды
     *  @property {number}  NumDevice  Устройство [0-9], где 0 - первое свободное
     *  @property {string}  IdCommand Идентификатор команды для возможности последующего запроса о ее выполнении
     *  @property  {string}  CashierName   имя кассира
     *  @property  {number}  Amount   Сумма
     */

    (function () {
        /**
         *  Синглетон для работы с фискальными регистраторами, подключенными к  KkmServer
         *  @global
         *  @namespace
         *
         */
        this.KkmServer = {
            default: {
                NumDevice: 0,
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
             * @param  {CommandKkm|CommandKkmWithCashier|CommandKkmWithAmount} Data Структура для передачи серверу
             *
             */
            execute: function (Data) {
                var JSon = $.toJSON(Data);
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
                $.lastCommand = Data;
                r.send(JSon);
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
             * @param {number} NumDevice целое 0-9
             * @returns this
             *
             */
            setNumDevice: function (NumDevice) {
                $.default.NumDevice = NumDevice;
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
             * @param {number} [NumDevice] 0-первое свободное
             * @returns {CommandKkm}
             * @constructor
             */
            CommandKkm: function (Command, NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: Command,
                    NumDevice: NumDevice,
                    IdCommand: $._generateCommandId()
                };
            },
            /**
             * Подготовка структуры запроса к серверу c ФИО кассира
             *
             * @param {string} Command Имя команды
             * @param {string} [CashierName] ФИО Кассира
             * @param {number} [NumDevice] 0-первое свободное
             * @returns {CommandKkmWithCashier}
             * @constructor
             */
            CommandKkmWithCashier: function (Command, CashierName, NumDevice) {
                CashierName = CashierName || $.default.CashierName;

                var Data = $.CommandKkm(Command, NumDevice);
                Data.CashierName = CashierName;

                return Data;
            },
            /**
             * Подготовка структуры запроса к серверу c суммой операции
             *
             * @param {string} Command Имя команды
             * @param {number} Amount Сумма
             * @param {string} [CashierName] ФИО Кассира
             * @param {number} [NumDevice] 0-первое свободное
             * @returns {CommandKkmWithAmount}
             * @constructor
             */
            CommandKkmWithAmount: function (Command, Amount, CashierName, NumDevice) {
                CashierName = CashierName || $.default.CashierName;

                var Data = $.CommandKkmWithCashier(Command, CashierName, NumDevice);
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
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkmWithAmount}
             */
            CommandDepositingCash: function (Amount, CashierName, NumDevice) {
                return $.CommandKkmWithAmount('DepositingCash', Amount, CashierName, NumDevice);
            },
            /**
             * Команда Получение данных KKT
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkm}
             * @constructor
             */
            CommandGetDataKKT: function (NumDevice) {
                return $.CommandKkm("GetDataKKT", NumDevice);
            },
            /**
             * Команда Запрос результата выполнения команды
             * @param {string} [IdCommand]
             * @param {number} [NumDevice]
             * @returns {CommandKkm}
             * @constructor
             */
            CommandGetRezult: function (IdCommand, NumDevice) {
                if (undefined === IdCommand) {
                    IdCommand = $.lastCommand.IdCommand;
                }
                if (undefined === NumDevice) {
                    NumDevice = $.lastCommand.NumDevice;
                }
                var data = $.CommandKkm("GetRezult", NumDevice);
                data.IdCommand = IdCommand;
                return data;
            },
            /**
             * Команда Список ККТ подключенных к серверу
             * @returns {{
             *      Command: string,
             *      NumDevice: number,
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
                    NumDevice: 0,
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
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkmWithAmount}
             * @constructor
             */
            CommandPaymentCash: function (Amount, CashierName, NumDevice) {
                return $.CommandKkmWithAmount('PaymentCash', Amount, CashierName, NumDevice);
            },
            /**
             * Команда Печать состояния обмена с ОФД
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkm}
             * @constructor
             */
            CommandOfdReport: function (NumDevice) {
                return $.CommandKkm("OfdReport", NumDevice);
            },
            /**
             * Команда Открыть денежный ящик
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkm}
             * @constructor
             */
            CommandOpenCashDrawer: function (NumDevice) {
                return $.CommandKkm("OpenCashDrawer", NumDevice);
            },
            /**
             * Команда Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkmWithCashier}
             * @constructor
             */
            CommandOpenShift: function (CashierName, NumDevice) {
                return $.CommandKkmWithCashier('OpenShift', CashierName, NumDevice);
            },
            /**
             * Команда Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkmWithCashier}
             * @constructor
             */
            CommandXReport: function (CashierName, NumDevice) {
                return $.CommandKkmWithCashier('XReport', NumDevice);
            },
            /**
             * Команда Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {CommandKkmWithCashier}
             * @constructor
             */
            CommandZReport: function (CashierName, NumDevice) {
                return $.CommandKkmWithCashier('ZReport', CashierName, NumDevice);
            },

            // -------------------------------------------------------
            //  Выполнение команд на сервере
            // -------------------------------------------------------

            /**
             * Внесение денег в кассу
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            depositingCash: function (Amount, CashierName, NumDevice) {
                $.execute($.CommandDepositingCash(Amount, CashierName, NumDevice));
            },
            /**
             * Получение данных KKT
             * @param {number} [NumDevice] Номер устройства
             */
            getDataKKT: function (NumDevice) {
                $.execute($.CommandGetDataKKT(NumDevice));
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
             * @param {number} [NumDevice]
             */
            getRezult: function (IdCommand, NumDevice) {
                $.execute($.CommandGetRezult(IdCommand, NumDevice));
            },
            /**
             * Выемка наличных
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            paymentCash: function (Amount, CashierName, NumDevice) {
                $.execute($.CommandPaymentCash(Amount, CashierName, NumDevice));
            },
            /**
             * Печать состояния обмена с ОФД
             * @param {number} [NumDevice] Номер устройства
             */
            printOfdReport: function (NumDevice) {
                $.execute($.CommandOfdReport(NumDevice));
            },
            /**
             * Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            printXReport: function (CashierName, NumDevice) {
                $.execute($.CommandXReport(CashierName, NumDevice));
            },
            /**
             * Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            printZReport: function (CashierName, NumDevice) {
                $.execute($.CommandZReport(CashierName, NumDevice));
            },
            /**
             * Открыть денежный ящик
             * @param {number} [NumDevice] Номер устройства
             */
            openCashDrawer: function (NumDevice) {
                $.execute($.CommandOpenCashDrawer(NumDevice));
            },
            /**
             * Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            openShift: function (CashierName, NumDevice) {
                $.execute($.CommandOpenShift(CashierName, NumDevice));
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
            }
        };
        var $ = this.KkmServer;
    }).apply(window);


//  --------------------------------------------------------------------------------------------
    (function () {
        var $ = this.KkmServer;
        /**
         * Чек, потом нужно добавить к нему строки
         *
         * @param {number} [TypeCheck]
         * @param {string} [CashierName]
         * @param {string} [InnKkm]
         * @param {number} [NumDevice]
         * @class
         */
        this.KkmServer.OpenCheck = function (TypeCheck, CashierName, InnKkm, NumDevice) {
            TypeCheck = TypeCheck || 0; // продажа
            NumDevice = NumDevice || $.default.NumDevice;
            InnKkm = InnKkm || $.default.InnKkm;
            CashierName = CashierName || $.default.CashierName;

            var self;
            return self = {
                Data: {
                    VerFFD: "1.0",
                    Command: "RegisterCheck",
                    NumDevice: NumDevice,
                    InnKkm: InnKkm,
                    KktNumber: "",
                    Timeout: 30,
                    IdCommand: $._generateCommandId(),
                    IsFiscalCheck: true,
                    TypeCheck: TypeCheck,
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
                },
                // --------------------------------------------------------------------------------------------
                // Добавление строк к чеку
                // --------------------------------------------------------------------------------------------
                /**
                 * Фискальная строка чека
                 * @param Name - [*]Название товара
                 * @param Quantity - [*]Количество
                 * @param Price - [*] цена
                 * @param Amount - [*] сумма
                 * @param Tax - Налогообложение
                 * @param Department - отдел магазина
                 * @param EAN13 - штрих код
                 * @param EGAIS
                 *
                 * @return {{Name, Quantity, Price, Amount, Department, Tax, EAN13, EGAIS}}
                 */
                addRegisterString: function (Name, Quantity, Price, Amount, Tax, Department, EAN13, EGAIS) {
                    var Data;

                        Data = {
                            Register: {
                                Name: Name,
                                Quantity: Quantity,
                                Price: Price,
                                Amount: Amount,
                                Department: Department,
                                Tax: Tax,
                                EAN13: EAN13,
                                EGAIS: EGAIS
                            }
                        };

                    self.Data.CheckStrings.push(Data);
                    return Data.Register;

                },
                /**
                 *
                 * @param Text
                 * @param Font
                 * @param Intensity
                 * @return {{Text, Font, Intensity}}
                 */
                addTextString: function (Text, Font, Intensity) {
                    var Data;

                    Data = {
                        PrintText: {
                            Text: Text,
                            Font: Font,
                            Intensity: Intensity
                        }
                    };

                    self.Data.CheckStrings.push(Data);
                    return Data.PrintText;

                },
                /**
                 *
                 * @param BarcodeType
                 * @param Barcode
                 * @return {{BarcodeType, Barcode}}
                 */
                addBarcodeString: function (BarcodeType, Barcode) {
                    var Data;
                    Data = {
                        BarCode: {
                            BarcodeType: BarcodeType,
                            Barcode: Barcode
                        }
                    };

                    self.Data.CheckStrings.push(Data);
                    return Data.BarCode;
                },
                /**
                 *
                 * @param DataCheck
                 * @param Image
                 * @return {{Image}}
                 * @constructor
                 */
                addImageString: function (DataCheck, Image) {
                    var Data;

                    Data = {
                        PrintImage: {
                            Image: Image
                        }
                    };

                    self.Data.CheckStrings.push(Data);
                    return Data.PrintImage;

                }

            };
        };
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
