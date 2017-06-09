if (!window.KkmServer) {
    KkmServer = {
        default: {
            NumDevice: 0,
            CashierName: 'Кассир',
            InnKkm: ''
        },
        funSuccess:undefined,
	funError:undefined,
        urlServer: 'http://localhost:5893/',
        user: 'Admin',
        password: '',
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
            // -------------------------------------------------------
            //  Формирование команды к серверу
            // -------------------------------------------------------
            DepositingCash: function (NumDevice, Amount, CashierName) {
                NumDevice = NumDevice || $.default.NumDevice;
                Amount = Amount || '0.00';
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "DepositingCash",
                    NumDevice: NumDevice,
                    Amount: Amount,
                    CashierName: CashierName,
                    IdCommand: $.NewGuid()
                };
            },
            GetDataKKT: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "GetDataKKT",
                    NumDevice: NumDevice,
                    IdCommand: $.NewGuid(),
                };
            },
            GetRezult: function (NumDevice, IdCommand) {

                return {
                    Command: "GetRezult",
                    NumDevice: NumDevice,
                    IdCommand: IdCommand
                };
            },
            List: function () {

                return {
                    Command: "List",
                    NumDevice: 0,
                    IdCommand: $.NewGuid(),
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
            PaymentCash: function (NumDevice, Amount, CashierName) {
                NumDevice = NumDevice || $.default.NumDevice;
                Amount = Amount || '0.00';
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "PaymentCash",
                    NumDevice: NumDevice,
                    Amount: Amount,
                    CashierName: CashierName,
                    IdCommand: $.NewGuid()
                };
            },
            OfdReport: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "OfdReport",
                    NumDevice: NumDevice,
                    IdCommand: $.NewGuid()
                };
            },
            OpenCashDrawer: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "OpenCashDrawer",
                    NumDevice: NumDevice,
                    IdCommand: $.NewGuid()
                };
            },
            OpenShift: function (NumDevice, CashierName) {
                NumDevice = NumDevice || $.default.NumDevice;
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "OpenShift",
                    NumDevice: NumDevice,
                    CashierName: CashierName,
                    IdCommand: $.NewGuid()
                };
            },
            RegisterCheck: function (TypeCheck, NumDevice, InnKkm, CashierName) {
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
                    IdCommand: $.NewGuid(),
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
            XReport: function (NumDevice) {
                NumDevice = NumDevice || $.default.NumDevice;

                return {
                    Command: "XReport",
                    NumDevice: NumDevice,
                    IdCommand: $.NewGuid()
                };
            },
            ZReport: function (NumDevice, CashierName) {
                NumDevice = NumDevice || $.default.NumDevice;
                CashierName = CashierName || $.default.CashierName;

                return {
                    Command: "ZReport",
                    NumDevice: NumDevice,
                    CashierName: CashierName,
                    IdCommand: $.NewGuid()
                };
            },
            // --------------------------------------------------------------------------------------------
            // Добавление строк к чеку
            // --------------------------------------------------------------------------------------------
            AddRegisterString:function(DataCheck, Name, Quantity, Price, Amount, Tax, Department, EAN13) {
                var Data;

                if (DataCheck.VerFFD == "1.0") {
                    Data = {
                        Register: {
                            Name: Name,
                            Quantity: Quantity,
                            Price: Price,
                            Amount: Amount,
                            Department: Department,
                            Tax: Tax,
                            EAN13: EAN13,
                            EGAIS: null
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
            AddBarcodeString:function(DataCheck, BarcodeType, Barcode) {
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
            AddImageString:function(DataCheck, Image) {
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
            // Передача команды серверу
            // --------------------------------------------------------------------------------------------

	  Execute:function(Data){    
	   var JSon = $.toJSON(Data);
	   jQuery.support.cors = true;
	   var jqXHRvar = jQuery.ajax({
	        type: 'POST',
	        async: true,
	        timeout: $.timeout,
	        url: $.urlServer  + 'Execute/sync',
	        crossDomain: true,
	        dataType: 'json',
	        contentType: 'application/json; charset=UTF-8',
	        processData: false,
	        data: JSon,
	        headers: ($.user != "" || $.password != "") ? { "Authorization": "Basic " + btoa($.user + ":" + $.password) } : "",
	        success: $.funSuccess,
	        error: $.funError
	    });
	},
            // --------------------------------------------------------------------------------------------
            // Герерация GUID
            // --------------------------------------------------------------------------------------------
            NewGuid: function () {
                function S4() {
                    var s = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    return s;
                }

                var guid = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
                return guid;
            }
        });
    })(KkmServer);

// --------------------------------------------------------------------------------------------
//   add toJson 
// --------------------------------------------------------------------------------------------

(function($){'use strict';var escape=/["\\\x00-\x1f\x7f-\x9f]/g,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},hasOwn=Object.prototype.hasOwnProperty;$.toJSON=typeof JSON==='object'&&JSON.stringify?JSON.stringify:function(o){if(o===null){return'null';}
var pairs,k,name,val,type=$.type(o);if(type==='undefined'){return undefined;}
if(type==='number'||type==='boolean'){return String(o);}
if(type==='string'){return $.quoteString(o);}
if(typeof o.toJSON==='function'){return $.toJSON(o.toJSON());}
if(type==='date'){var month=o.getUTCMonth()+1,day=o.getUTCDate(),year=o.getUTCFullYear(),hours=o.getUTCHours(),minutes=o.getUTCMinutes(),seconds=o.getUTCSeconds(),milli=o.getUTCMilliseconds();if(month<10){month='0'+month;}
if(day<10){day='0'+day;}
if(hours<10){hours='0'+hours;}
if(minutes<10){minutes='0'+minutes;}
if(seconds<10){seconds='0'+seconds;}
if(milli<100){milli='0'+milli;}
if(milli<10){milli='0'+milli;}
return'"'+year+'-'+month+'-'+day+'T'+
hours+':'+minutes+':'+seconds+'.'+milli+'Z"';}
pairs=[];if($.isArray(o)){for(k=0;k<o.length;k++){pairs.push($.toJSON(o[k])||'null');}
return'['+pairs.join(',')+']';}
if(typeof o==='object'){for(k in o){if(hasOwn.call(o,k)){type=typeof k;if(type==='number'){name='"'+k+'"';}else if(type==='string'){name=$.quoteString(k);}else{continue;}
type=typeof o[k];if(type!=='function'&&type!=='undefined'){val=$.toJSON(o[k]);pairs.push(name+':'+val);}}}
return'{'+pairs.join(',')+'}';}};$.evalJSON=typeof JSON==='object'&&JSON.parse?JSON.parse:function(str){return eval('('+str+')');};$.secureEvalJSON=typeof JSON==='object'&&JSON.parse?JSON.parse:function(str){var filtered=str.replace(/\\["\\\/bfnrtu]/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,'');if(/^[\],:{}\s]*$/.test(filtered)){return eval('('+str+')');}
throw new SyntaxError('Error parsing JSON, source is not valid.');};$.quoteString=function(str){if(str.match(escape)){return'"'+str.replace(escape,function(a){var c=meta[a];if(typeof c==='string'){return c;}
c=a.charCodeAt();return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);})+'"';}
return'"'+str+'"';};}(KkmServer));

}