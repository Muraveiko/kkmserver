/**
 *  Синглетон для работы с фискальными регистраторами, подключенных к  KkmServer
 *  @see https://kkmserver.ru/KkmServer
 *
 *  @author Oleg Muraveyko
 *  @link https://github.com/Muraveiko/kkmserver
 *  @version 0.0.2
 */
if (!window.KkmServer) {
    KkmServer = {
        default: {
            NumDevice: 0,
            CashierName: '',
            InnKkm: ''
        },
        funSuccess: undefined,
        funError: function(xhr, status) {
            alert("Request failed: " +status);
        },
        urlServer: 'http://localhost:5893/',
        auth: '',
        timeout: 60000 //Минута - некоторые драйверы при работе выполняют интерактивные действия с пользователем - тогда увеличте тайм-аут
    };

    KkmServer.extend = function (dest, src, skipexist) {
        var overwrite = !skipexist;
        for (var i in src)
            if (overwrite || !dest.hasOwnProperty(i))
                dest[i] = src[i];
        return dest;
    };

    (function ($) {
        $.extend($, {
            /**
             *  Параметры подключения
             * @param user Имя пользователя
             * @param password Пароль
             * @param urlServer Адрес сервера
             * @return this;
             */
            Connect: function(user,password,urlServer){
                if(undefined !== urlServer){
                    $.urlServer = urlServer;
                }
                if(undefined !== password || undefined !== user){
                    $.auth = "Basic " + btoa(user + ":" + password);
                }
                return $;
            },
            /**
             * Передача команды серверу
             * @param  Data Подготовленный по правилам объект
             *
             */
            Execute: function (Data) {
                var JSon = $.toJSON(Data);
                var r = new XMLHttpRequest();
                r.open("POST", $.urlServer+ 'Execute/sync', true);
                r.responseType =  'json';
                r.setRequestHeader("Authorization", $.auth);
                r.onload = function(){$.funSuccess(r.response);};
                r.onerror = function(){$.funError(r,'ajax error');};
                r.send(JSon);
            },
            // -------------------------------------------------------
            //  Хуки на обработку результата ajax запроса
            // -------------------------------------------------------
            HookAjaxSuccess: function(funSuccess){
                $.funSuccess = funSuccess;
                return $;
            },
            HookAjaxFail: function(funError){
                $.funError = funError;
                return $;
            },
            // -------------------------------------------------------
            //  Сеттеры
            // -------------------------------------------------------

            /**
             * Номер Устройства по умолчанию
             * @param NumDevice целое 0-9
             * @returns this
             */
            SetNumDevice: function (NumDevice) {
                $.default.NumDevice = NumDevice;
                return $;
            },
            /**
             * Кассир по умолчанию
             * @param CashierName ФИО
             * @returns this
             */
            SetCashierName: function (CashierName) {
                $.default.CashierName = CashierName;
                return $;
            },
            /**
             * Инн кассы чтобы чек не ушел неправильно
             * @param InnKkm
             * @return this
             */
            SetInnKkm : function (InnKkm) {
                $.default.InnKkm = InnKkm;
                return $;
            },
            // -------------------------------------------------------
            //  Формирование команд к серверу
            // -------------------------------------------------------

            /**
             * Внесение денег в кассу
             * @param Amount Сумма (0.00)
             * @param CashierName  Кассир
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), Amount: (*|string), CashierName: (*|string), IdCommand: *}}
             * @constructor
             */
            DepositingCash: function (Amount, CashierName, NumDevice) {
                CashierName = CashierName || $.default.CashierName;
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "DepositingCash",
                    NumDevice: NumDevice,
                    Amount: Amount,
                    CashierName: CashierName,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Получение данных KKT
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), IdCommand: *}}
             * @constructor
             */
            GetDataKKT: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "GetDataKKT",
                    NumDevice: NumDevice,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Запрос результата выполнения команды
             * @param IdCommand
             * @param NumDevice
             * @returns {{Command: string, NumDevice: *, IdCommand: *}}
             * @constructor
             */
            GetRezult: function (IdCommand, NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "GetRezult",
                    NumDevice: NumDevice,
                    IdCommand: IdCommand
                };
            },
            /**
             * Список ККТ подключенных к серверу
             * @returns {{Command: string, NumDevice: number, IdCommand: *, InnKkm: string, Active: null, OnOff: null, OFD_Error: null, OFD_DateErrorDoc: string, FN_DateEnd: string, FN_MemOverflowl: null, FN_IsFiscal: null}}
             * @constructor
             */
            List: function () {

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
             * Выемка наличных
             * @param Amount Сумма
             * @param CashierName Кассир
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), Amount: (*|string), CashierName: (*|string), IdCommand: *}}
             * @constructor
             */
            PaymentCash: function (Amount, CashierName, NumDevice) {
                Amount = Amount || '0.00';
                CashierName = CashierName || $.default.CashierName;
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "PaymentCash",
                    NumDevice: NumDevice,
                    Amount: Amount,
                    CashierName: CashierName,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Печать состояния обмена с ОФД
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), IdCommand: *}}
             * @constructor
             */
            OfdReport: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "OfdReport",
                    NumDevice: NumDevice,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Открыть денежный ящик
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), IdCommand: *}}
             * @constructor
             */
            OpenCashDrawer: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "OpenCashDrawer",
                    NumDevice: NumDevice,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Окрыть смену
             * @param NumDevice
             * @param CashierName
             * @returns {{Command: string, NumDevice: (*|number), CashierName: (*|string), IdCommand: *}}
             * @constructor
             */
            OpenShift: function (NumDevice, CashierName) {
                NumDevice = NumDevice || $.default.NumDevice;
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "OpenShift",
                    NumDevice: NumDevice,
                    CashierName: CashierName,
                    IdCommand: $._NewGuid()
                };
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
            RegisterCheck: function (TypeCheck, CashierName, InnKkm, NumDevice) {
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
             * Печать Х-отчета 
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), IdCommand: *}}
             * @constructor
             */
            XReport: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "XReport",
                    NumDevice: NumDevice,
                    IdCommand: $._NewGuid()
                };
            },
            /**
             * Закрытие смены
             * @param CashierName
             * @param NumDevice
             * @returns {{Command: string, NumDevice: (*|number), CashierName: (*|string), IdCommand: *}}
             * @constructor
             */
            ZReport: function (CashierName,NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "ZReport",
                    NumDevice: NumDevice,
                    CashierName: CashierName,
                    IdCommand: $._NewGuid()
                };
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
            AddRegisterString: function (DataCheck, Name, Quantity, Price, Amount, Tax, Department, EAN13,EGAIS) {
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
            AddTextString: function (DataCheck, Text, Font, Intensity) {
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
            AddBarcodeString: function (DataCheck, BarcodeType, Barcode) {
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
            AddImageString: function (DataCheck, Image) {
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
             * Внутрений метод.
             * Советую для регистрации чеков формировать idCommand самостоятельно
             * @returns {string}
             * @private
             */
            _NewGuid: function () {
                function S4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                }
                return  (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            }
        });
    })(KkmServer);

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