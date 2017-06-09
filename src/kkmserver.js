if (!window.KkmServer) {
    KkmServer = {
        default: {
            NumDevice: 0,
            CashierName: 'Кассир',
            InnKkm: ''
        },
        User: "Admin",
        Password: ""
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
                    IdCommand: KkmServer_NewGuid(),
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
                    IdCommand: KkmServer_NewGuid(),
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
                    IdCommand: KkmServer_NewGuid(),
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
}