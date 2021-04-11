// 応答メッセージ用のAPI URL
var RET_URL = 'https://api.line.me/v2/bot/message/reply';
var PUSH_URL = 'https://api.line.me/v2/bot/message/push';

// LINE developersのメッセージ送受信設定に記載のアクセストークン
var ACCESS_TOKEN = '{your token}';

// 成功判定用文字列
var KIYOSHI = "ずんずんずんずんドコ";

function doPost(e) {
  try {
    // WebHookで受信した応答用Token
    var replyToken = JSON.parse(e.postData.contents).events[0].replyToken;
    // ユーザーのメッセージを取得
    var userMessage = JSON.parse(e.postData.contents).events[0].message.text;
    // ユーザーのID
    var userId = JSON.parse(e.postData.contents).events[0].source.userId;
    // 応答メッセージ
    var retMessage = "What are you talking about???";

    console.log("userId='%s', userMessage='%s'", userId, userMessage);

    // 許可されたメッセージの場合のみ処理
    if(userMessage == "ずん" || userMessage == "ドコ") {
      // メッセージを保存
      saveMessage(userId, userMessage);

      // ユーザーのメッセージが「ずん」の場合
      if(userMessage == "ずん") {
        // 応答メッセージを作成
        retMessage = Math.floor(Math.random()*2) < 1 ? "ずん" : "ドコ";
        // 応答メッセージを保存
        saveMessage(userId, retMessage);
        // 応答メッセージを送信
        replyMessage(replyToken, retMessage);
      }
    }

    // ユーザーまたは bot が「ドコ」を言った場合
    var success = false;
    if(userMessage == "ドコ" || retMessage == "ドコ") {
      // ズンドコキヨシ成功の場合
      if(isKIYOSHI(userId)) {
        pushMessage(userId, "成功だよ！");
      }
      // 失敗の場合
      else {
        pushMessage(userId, "失敗だよ！");
      }
      // ユーザーのメッセージ履歴を削除
      delUserColumn(userId);
    }

    return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch(ex) {
    console.log(ex);
  }

  return;
}

function replyMessage(replyToken, message) {
  UrlFetchApp.fetch(RET_URL, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': message,
      }],
    }),
  });

  return;
}

function pushMessage(userId, message) {
  UrlFetchApp.fetch(PUSH_URL, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'to': userId,
      'messages': [{
        'type': 'text',
        'text': message,
      }],
    }),
  });

  return;
}

function saveMessage(userId, message) {
  const sheet = SpreadsheetApp.getActiveSheet(); 
  const lastCol = sheet.getLastColumn();
  var existUserId = false;
  var targetColNum = lastCol;
  var targetRowNum = 1;
  
  // 1 列目から userId を検索
  for(let i = 1; i <= lastCol; i++) {
    if(sheet.getRange(1, i).getValue()){ 
      if(sheet.getRange(1, i).getValue() == userId) {
        targetColNum = i;
        existUserId = true;
        break;
      }
    }
  }

  // 見つけた userId の列の最終行にメッセージを追記
  if(existUserId) {
    targetRowNum = sheet.getRange(1, targetColNum).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
    sheet.getRange((targetRowNum+1), targetColNum).setValue(message);
  }
  // userId が見つからなかった場合、最終列に userId 列を追加＋メッセージ追記
  else {
    sheet.getRange(1, targetColNum+1).setValue(userId);
    sheet.getRange(2, targetColNum+1).setValue(message);
  }

  return;
}

function isKIYOSHI(userId) {
  const sheet = SpreadsheetApp.getActiveSheet(); 
  const lastCol = sheet.getLastColumn();
  var targetColNum = 0;
  
  // 1 列目から userId を検索
  for(let i = 1; i <= lastCol; i++) {
    if(sheet.getRange(1, i).getValue()){ 
      if(sheet.getRange(1, i).getValue() == userId) {
        targetColNum = i;
        break;
      }
    }
  }

  // 対象列の最後の行番号を取得
  var lastRow = sheet.getRange(1, targetColNum).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  // 5 行分存在しなければ false
  if(lastRow < 5) {
    return false;
  }
  // 直近 5 回分のメッセージを連結する
  var targets = (sheet.getRange(lastRow - 4, targetColNum).getValue() + sheet.getRange(lastRow - 3, targetColNum).getValue() + sheet.getRange(lastRow - 2, targetColNum).getValue() + sheet.getRange(lastRow - 1, targetColNum).getValue() + sheet.getRange(lastRow, targetColNum).getValue());

  return (KIYOSHI == targets);
}

function delUserColumn(userId) {
  const sheet = SpreadsheetApp.getActiveSheet(); 
  const lastCol = sheet.getLastColumn();
  
  // 1 列目から userId を検索
  for(let i = 1; i <= lastCol; i++) {
    if(sheet.getRange(1, i).getValue()){ 
      if(sheet.getRange(1, i).getValue() == userId) {
        sheet.deleteColumn(i);
        break;
      }
    }
  }

  return;
}
