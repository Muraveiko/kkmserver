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
    (function(){
        /**
         *  Синглетон для работы с фискальными регистраторами, подключенными к  KkmServer
         *  @global
         *  @namespace
         */
        this.KkmServer =  {
            default: {
                NumDevice: 0,
                CashierName: '',
                InnKkm: ''
            },
            /**
             * @method
             */
            funSuccess: null,
            funError: function (xhr, status) {
                alert("Request failed: " + status);
            },
            curCommand: {}, // for support chaining as jQuery
            urlServer: 'http://localhost:5893/',
            auth: '',
            timeout: 60000, //Минута - некоторые драйверы при работе выполняют интерактивные действия с пользователем - тогда увеличте тайм-аут
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
             * @param  {KkmServer.CommandKkm|KkmServer.CommandKkmWithCashier} Data Структура для передачи серверу
             *
             */
            execute: function (Data) {
                $.lastCommand = Data;
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

            // -------------------------------------------------------
            //  Формирование команд к серверу
            // -------------------------------------------------------

            /**
             * Команда Внесение денег в кассу
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {{Command: string, NumDevice: number, Amount: number, CashierName: string, IdCommand: string}}
             * @see  описание возращаемой структуры см. {@link CommandKkmWithCashier}
             */
            CommandDepositingCash: function (Amount, CashierName, NumDevice) {
                var Data = $.CommandKkmWithCashier('DepositingCash', CashierName, NumDevice);
                Data.Amount = Amount;
                return Data;
            },
            /**
             * Внесение денег в кассу
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns this
             */
            depositingCash: function (Amount, CashierName, NumDevice) {
                $.curCommand = $.CommandDepositingCash(Amount, CashierName, NumDevice);
                return $;
            },
            /**
             * Команда Получение данных KKT
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkm}
             */
            CommandGetDataKKT: function (NumDevice) {
                return $.CommandKkm("GetDataKKT", NumDevice);
            },
            /**
             * Получение данных KKT
             * @param {number} [NumDevice] Номер устройства
             * @returns this
             */
            getDataKKT: function (NumDevice) {
                $.curCommand = $.CommandGetDataKKT(NumDevice);
                return $;
            },

            /**
             * Команда Запрос результата выполнения команды
             * @param {string} IdCommand
             * @param {number} NumDevice
             * @returns {KkmServer.CommandKkm}
             */
            CommandGetRezult: function (IdCommand, NumDevice) {
                return {
                    Command: "GetRezult",
                    NumDevice: NumDevice,
                    IdCommand: IdCommand
                };
            },
            /**
             * Запрос результата выполнения команды
             * @param {string} IdCommand
             * @param {number} NumDevice
             * @returns this
             */
            getRezult: function (IdCommand, NumDevice) {
                $.curCommand = $.CommandGetRezult(IdCommand, NumDevice);
                return $;
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
                    IdCommand: $._NewGuid(),
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
             * Список ККТ подключенных к серверу
             * @returns this
             */
            getList: function () {
                $.curCommand = $.CommandList();
                return $;
            },
            /**
             * Команда Выемка наличных
             * @param {number} Amount Сумма
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {{Command: string, NumDevice: number, Amount: number, CashierName: string, IdCommand: string}}
             */
            CommandPaymentCash: function (Amount, CashierName, NumDevice) {

                var Data = $.CommandKkmWithCashier('PaymentCash', CashierName, NumDevice);
                Data.Amount = Amount;

                return Data;
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
             * Команда Печать состояния обмена с ОФД
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkm}
             */
            CommandOfdReport: function (NumDevice) {
                return $.CommandKkm("OfdReport", NumDevice);
            },
            /**
             * Печать состояния обмена с ОФД
             * @param {number} [NumDevice] Номер устройства
             */
            printOfdReport: function (NumDevice) {
                $.execute($.CommandOfdReport(NumDevice));
            },
            /**
             * Команда Открыть денежный ящик
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkm}
             */
            CommandOpenCashDrawer: function (NumDevice) {
                return $.CommandKkm("OpenCashDrawer", NumDevice);
            },
            /**
             * Открыть денежный ящик
             * @param {number} [NumDevice] Номер устройства
             */
            openCashDrawer: function (NumDevice) {
                $.execute($.CommandOpenCashDrawer(NumDevice));
            },
            /**
             * Команда Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkmWithCashier}
             */
            CommandOpenShift: function (CashierName, NumDevice) {
                return $.CommandKkmWithCashier('OpenShift', CashierName, NumDevice);
            },
            /**
             * Окрыть смену
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            openShift: function (CashierName, NumDevice) {
                $.execute($.CommandOpenShift(CashierName,NumDevice));
            },

            /**
             * Инициализировать команду для печати чека, потом нужно добавить к ней строки
             * @see https://kkmserver.ru/KkmServer#PrimerJavaCheck
             *
             * @param TypeCheck смотри типы по ссылке
             * @param CashierName
             * @param InnKkm
             * @param NumDevice
             * @returns {{VerFFD: string, Command: string, NumDevice: (*|number), InnKkm: (*|string), KktNumber: string, Timeout: number, IdCommand: *, IsFiscalCheck: boolean, TypeCheck: (*|number), CancelOpenedCheck: boolean, NotPrint: boolean, NumberCopies: number, CashierName: (*|string), ClientAddress: string, TaxVariant: string, CheckProps: Array, AdditionalProps: Array, KPP: string, ClientId: string, KeySubLicensing: string, CheckStrings: Array, Cash: number, CashLessType1: number, CashLessType2: number, CashLessType3: number}}
             * @constructor
             */
            CommandRegisterCheck: function (TypeCheck, CashierName, InnKkm, NumDevice) {
                TypeCheck = TypeCheck || 0; // продажа
                NumDevice = NumDevice || $.default.NumDevice;
                InnKkm = InnKkm || $.default.InnKkm;
                CashierName = CashierName || $.default.CashierName;

                return {
                    VerFFD: "1.0",
                    Command: "RegisterCheck",
                    NumDevice: NumDevice,
                    InnKkm: InnKkm,
                    KktNumber: "",
                    Timeout: 30,
                    IdCommand: $._NewGuid(),
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
                };
            },
            /**
             * Команда Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkmWithCashier}
             */
            CommandXReport: function (CashierName,NumDevice) {
                return $.CommandKkmWithCashier('XReport', NumDevice);
            },
            /**
             * Печать Х-отчета
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            printXReport: function (CashierName,NumDevice) {
                $.execute($.CommandXReport(CashierName,NumDevice));
            },
            /**
             * Команда Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             * @returns {KkmServer.CommandKkmWithCashier}
             */
            CommandZReport: function (CashierName, NumDevice) {
                return $.CommandKkmWithCashier('ZReport', CashierName, NumDevice);
            },
            /**
             * Закрытие смены
             * @param {string} [CashierName] имя кассира
             * @param {number} [NumDevice] Номер устройства
             */
            printZReport: function (CashierName, NumDevice) {
                $.execute($.CommandZReport(CashierName,NumDevice));
            },
            // --------------------------------------------------------------------------------------------
            // Добавление строк к чеку
            // --------------------------------------------------------------------------------------------
            /**
             * Фискальная строка чека
             * @param DataCheck - [*] переменная чека , полученная в результате вызова KkmServer.RegisterCheck
             * @param Name - [*]Название товара
             * @param Quantity - [*]Количество
             * @param Price - [*] цена
             * @param Amount - [*] сумма
             * @param Tax - Налогообложение
             * @param Department - отдел магазина
             * @param EAN13 - штрих код
             * @param EGAIS
             *
             * @return {Register|{Name, Quantity, Price, Amount, Department, Tax, EAN13, EGAIS}}
             * @constructor
             */
            checkRegisterString: function (DataCheck, Name, Quantity, Price, Amount, Tax, Department, EAN13, EGAIS) {
                var Data;

                if (DataCheck.VerFFD === "1.0") {
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
                    }
                }

                DataCheck.CheckStrings.push(Data);
                return Data.Register;

            },
            /**
             *
             * @param DataCheck
             * @param Text
             * @param Font
             * @param Intensity
             * @return {PrintText|{Text, Font, Intensity}}
             * @constructor
             */
            checkTextString: function (DataCheck, Text, Font, Intensity) {
                var Data;

                Data = {
                    PrintText: {
                        Text: Text,
                        Font: Font,
                        Intensity: Intensity
                    }
                };

                DataCheck.CheckStrings.push(Data);
                return Data.PrintText;

            },
            /**
             *
              * @param DataCheck
             * @param BarcodeType
             * @param Barcode
             * @return {BarCode|{BarcodeType, Barcode}}
             * @constructor
             */
            checkBarcodeString: function (DataCheck, BarcodeType, Barcode) {
                var Data;
                Data = {
                    BarCode: {
                        BarcodeType: BarcodeType,
                        Barcode: Barcode
                    }
                };

                DataCheck.CheckStrings.push(Data);
                return Data.BarCode;
            },
            /**
             *
             * @param DataCheck
             * @param Image
             * @return {PrintImage|{Image}}
             * @constructor
             */
            checkImageString: function (DataCheck, Image) {
                var Data;

                Data = {
                    PrintImage: {
                        Image: Image
                    }
                };

                DataCheck.CheckStrings.push(Data);
                return Data.PrintImage;

            },

            // --------------------------------------------------------------------------------------------
            // Служебное
            // --------------------------------------------------------------------------------------------
            /**
             * Подготовка структуры запроса к серверу
             * @param {string} Command Имя команды
             * @param {number} [NumDevice] 0-первое свободное
             * @returns {{Command: string,NumDevice: number,IdCommand: string}}
             * @constructor
             * @see см. вариант с ФИО {@link KkmServer.CommandKkmWithCashier}
             * @see Устройство по умолчанию {@link KkmServer.setNumDevice}
             *
             * @example <caption>возвращаемая структура</caption>
             * {
             *      Command: string,   // Имя команды
             *      NumDevice: number, // Устройство [0-9], где
             *                         //    0 - первое свободное
             *                         //    если не указано явно берется указанное по умолчанию
             *      IdCommand: string  // Идентификатор команды для возможности последующего запроса о ее выполнении
             *                         // для чеков рекомендую формировать самостоятельно, чтобы избежать дублирования
             * }
             *
             */
            CommandKkm: function (Command, NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: Command,
                    NumDevice: NumDevice,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Подготовка структуры запроса к серверу c ФИО кассира
             *
             * @param {string} Command Имя команды
             * @param {string} [CashierName] ФИО Кассира
             * @param {number} [NumDevice] 0-первое свободное
             * @returns {{Command: string,NumDevice: number,CashierName: string,IdCommand: string}}
             * @constructor
             * @see см. вариант без ФИО {@link CommandKkm}
             * @see Устройство по умолчанию {@link setNumDevice}
             * @see  ФИО Кассира {@link setCashierName}
             *
             * @example <caption>возвращаемая структура</caption>
             * {
             *      Command: string,    // Имя команды
             *      NumDevice: number,  // Устройство [0-9], где
             *                          //    0 - первое свободное
             *                          //    если не указано явно берется указанное по умолчанию
             *      CashierName: string, //  имя кассира,
             *                          //  если не указано явно берется указанное по умолчанию
             *      IdCommand: string   // Идентификатор команды для возможности последующего запроса о ее выполнении
             *                          // для чеков рекомендую формировать самостоятельно, чтобы избежать дублирования
             * }
             */
            CommandKkmWithCashier: function (Command, CashierName, NumDevice) {
                CashierName = CashierName || $.default.CashierName;

                var Data = $.CommandKkm(Command, NumDevice);
                Data.CashierName = CashierName;

                return Data;
            },


            /**
             * Внутрений метод.
             * Советую для регистрации чеков формировать idCommand самостоятельно
             * @returns {string}
             * @private
             */
            _NewGuid: function () {
                function S4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                }

                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
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
    }(KkmServer));

}