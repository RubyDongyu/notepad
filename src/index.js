import { ipcRenderer, remote } from 'electron';
const {Menu, MenuItem, dialog} = remote;

let currentFile = null;
let isSaved = true;
let txtEditor = document.getElementById('txtEditor');

document.title = 'Notepad - Untitled';

const contextMenuTemplate = [
    {role: 'undo'},
    { role: 'redo' },       //Redo菜单项
    { type: 'separator' },  //分隔线
    { role: 'cut' },        //Cut菜单项
    { role: 'copy' },       //Copy菜单项
    { role: 'paste' },      //Paste菜单项
    { role: 'delete' },     //Delete菜单项
    { type: 'separator' },  //分隔线
    { role: 'selectall' }   //Select All菜单项
];
const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
txtEditor.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  contextMenu.popup(remote.getCurrentWindow());
});

txtEditor.oninput=(e)=>{
  if(isSaved) document.title += ' *';
  isSaved = false;
};

ipcRenderer.on('action', (event, arg) => {

    switch(arg){        
    case 'new': //新建文件
        askSaveIfNeed();
        currentFile=null;
        txtEditor.value='';   
        document.title = "Notepad - Untitled";
        //remote.getCurrentWindow().setTitle("Notepad - Untitled *");
        isSaved=true;
        break;
    case 'open': //打开文件
        askSaveIfNeed();
        const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Text Files", extensions: ['txt', 'js', 'html', 'md'] }, 
                { name: 'All Files', extensions: ['*'] } ],
            properties: ['openFile']
        });
        if(files){
            currentFile=files[0];
            const txtRead=readText(currentFile);
            txtEditor.value=txtRead;
            document.title = "Notepad - " + currentFile;
            isSaved=true;
        }
        break;
    case 'save': //保存文件
        saveCurrentDoc();
        break;
    case 'exiting':
        askSaveIfNeed();
        ipcRenderer.sendSync('reqaction', 'exit');
        break;
    }
});

//读取文本文件
function readText(file){
    const fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}
//保存文本内容到文件
function saveText(text, file){
    const fs = require('fs');
    fs.writeFileSync(file, text);
}

//保存当前文档
function saveCurrentDoc(){
    if(!currentFile){
        const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Text Files", extensions: ['txt', 'js', 'html', 'md'] }, 
                { name: 'All Files', extensions: ['*'] } ]
        });
        if(file) currentFile=file;
    }
    if(currentFile){
        const txtSave=txtEditor.value;
        saveText(txtSave, currentFile);
        isSaved=true;
        document.title = "Notepad - " + currentFile;
    }
}

//如果需要保存，弹出保存对话框询问用户是否保存当前文档
function askSaveIfNeed(){
    if(isSaved) return;
    const response=dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: [ 'Yes', 'No' ]
    });
    if(response==0) saveCurrentDoc(); //点击Yes按钮后保存当前文档
}