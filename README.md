# KkmServer.js

Js-библиотека для взаимодействия со специальным сервером, посредством
Ajax запросов. Дополнительные библиотеки не требуются.
 
##  KkmServer
 
- Программа предназначена для печати и регистрации фискальных/не фискальных чеков на Контрольно-кассовой технике оборудованной фискальным накопителем (далее ККТ).
- Программа является маленьким HTTP web-сервером и имеет встроенные драйвера ККТ (кроме драйверов Usb-Com).
- Позволяет печатать/регистрировать чеки с мобильных устройств / планшетов или с настольного ПК из 1с одновременно.
- Позволяет печатать/регистрировать чеки на KKM подключенных к другим ПК.
- Есть возможность печати этикеток с штрих-кодами на принтерах этикеток.
- Так-же возможно использовать ККТ в качестве принтера этикеток.
- Технология использования - HTTP(Ajax/REST) запрос, данные передаются через JSON;
- [Страница программы](https://kkmserver.ru/KkmServer)
 
## Пример использования

### Подключаем библиотеку
```html
  <script src="./src/kkmserver.js"></script>
```
После этого взаимодействие с кассой идет через объект **KkmServer**. 

### Описываем CallBack
```javascript
/**
* Функция вызываемая после обработки команды - обработка возвращаемых данных
* @param {{Status,Error,URL,Command,IdCommand,NumDevice}} Rezult - ответ ККM
*/
        function ExecuteSuccess(Rezult) {
            var Responce = "";

            if (Rezult.Status === 0) {
                Responce = Responce + "Статус: " + "Ok" + "\r\n";
            } else if (Rezult.Status === 1) {
                Responce = Responce + "Статус: " + "Выполняется" + "\r\n";
            } else if (Rezult.Status === 2) {
                Responce = Responce + "Статус: " + "Ошибка!" + "\r\n";
            } else if (Rezult.Status === 3) {
                Responce = Responce + "Статус: " + "Данные не найдены!" + "\r\n";
            }


            // Текст ошибки
            if (Rezult.Error !== undefined && Rezult.Error !== "") {
                Responce = Responce + "Ошибка: " + Rezult.Error + "\r\n";
            }

            if (Rezult !== undefined) {
                var JSon = JSON.stringify(Rezult, null, 4);
                Responce = Responce + "JSON ответа: \r\n" + JSon + "\r\n";
            }

            document.getElementById('Responce').textContent = Responce;
        }
```

### Инициализация  
```javascript
KkmServer.connect('Admin', '').setHookAjaxSuccess(ExecuteSuccess)
```

### Выполнение команд
```javascript
      KkmServer.depositingCash(2.05);

      var check = KkmServer.OpenCheck();
      check.addRegisterString('Мыло',1,1,1);
      check.Data.Cash = 1;
      KkmServer.execute(check.Data);
```

**Enjoy**

## History

### Альфа версии
- 0.1.0 - Переработан полностью набор методов. Добавлена документация.   
- 0.0.2 - Первая публичная версия 

