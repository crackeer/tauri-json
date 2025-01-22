import React, { useEffect, useState } from "react";
import "jsoneditor/dist/jsoneditor.css";
import "@arco-design/web-react/dist/css/arco.css";
import { Button, Modal, Space, Message, Input } from "@arco-design/web-react";
import { writeTextFile, BaseDirectory, readTextFile, exists, create, mkdir } from '@tauri-apps/plugin-fs';
import { IconSave, IconImport, IconFire, IconAlignLeft, IconRefresh, IconAlignRight, IconCopy } from "@arco-design/web-react/icon";
import JSONEditor from 'jsoneditor';
import dayjs from "dayjs";
import { save, open } from '@tauri-apps/plugin-dialog';
import invoke from "@/util/invoke";
import jsonToGo from "@/util/json-to-go";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
const loadJSONEditor = (initValue, onValidate, onChangeText) => {
    const container = document.getElementById("jsoneditor")
    const options = {
        mode: 'code',
        indentation: 4,
        onValidate: onValidate,
        templates: {},
        onChangeText: onChangeText,
    };
    let jsoneditor = new JSONEditor(container, options);
    console.log("loadJSONEditor")
    jsoneditor.set(initValue);
    return jsoneditor
}

var getCurrent = async () => {
    try {
        let value = await readTextFile('current.json', { baseDir: BaseDirectory.AppData });
        return value
    } catch (e) {
        return '{}'
    }
}
var setCurrent = async (value) => {
    try {
        console.log("setCurrent", value)
        let dirExists = await exists('', {
            baseDir: BaseDirectory.AppData,
        });
        if (!dirExists) {
            await mkdir('', { baseDir: BaseDirectory.AppData });
        }
        let fileExists = await exists('current.json', {
            baseDir: BaseDirectory.AppData,
        });
        if (!fileExists) {
            let result = await create('current.json', { baseDir: BaseDirectory.AppData });
        }
        return await writeTextFile('current.json', value, { baseDir: BaseDirectory.AppData });
    } catch (e) {
        console.log(e)
        return false;
    }
}

var getJsonHeight = () => {
    return document.documentElement.clientHeight - 70
}


var editor = null;
function App1() {
    const [jsonHeight, setJsonHeight] = useState(400)

    useEffect(() => {
        getCurrent().then((value) => {
            if (editor == null) {
                let data = JSON.parse(value)
                editor = loadJSONEditor(data, (value) => {
                    setCurrent(JSON.stringify(value))
                }, null)
            }
        }).catch((e) => {
            console.log(e)
        })

        setJsonHeight(getJsonHeight())
        window.onresize = () => {
            setJsonHeight(getJsonHeight())
        };
    }, [])

    var loadJSON = async () => {
        let file = await open({
            multipart: false,
            filters: [
                {
                    name: "",
                    extensions: ["json"],
                },
            ],
        });
        if (file == null) return;
        let content = await invoke.readFile(file);
        try {
            editor.setText(content)
        } catch (e) {
            Message.error("文件格式错误")
        }
    }
    var saveJSON = async () => {
        let file = await save({
            title: dayjs().format("YYYY-MM-DD-HH-mm-ss") + ".json",
            filters: [
                {
                    name: dayjs().format("YYYY-MM-DD-HH-mm-ss"),
                    extensions: ["json"],
                },
            ],
        });
        if (file == null) return;
        await invoke.writeFile(file, JSON.stringify(editor.get()));
        Message.success("保存成功");
    }

    var serialize = () => {
        editor.set(JSON.stringify(editor.get()))
    }

    var deserializeJSON = () => {
        console.log(editor.getText())
        try {
            let data = JSON.parse(JSON.parse(editor.getText()))
            console.log(data)
            editor.set(data)
        } catch (e) {
            Message.error("反序列化失败")
        }
    }

    var toGoStruct = () => {
        let result = jsonToGo(JSON.stringify(editor.get()), null, null, false);
        Modal.info({
            icon: null,
            title: <div style={{ textAlign: 'left' }}>Go结构体</div>,
            content: <div>
                <Input.TextArea value={result.go} rows={15}></Input.TextArea>
            </div>,
            style: { width: "65%" },
        })
    }

    var clearJSON = () => {
        editor.set({});
    }

    var copy = () => {
        let text = editor.getText()
        writeText(text).then(() => {
            Message.success("复制成功")
        })
    }
    return <div>
        <div style={{ height: jsonHeight }} id="jsoneditor" ></div>
        <div style={{ textAlign: "center", marginTop: "15px" }}>
            <Space>
                <Button onClick={loadJSON} type="outline" icon={<IconImport />}>加载</Button>
                <Button type="outline" icon={<IconSave />} onClick={saveJSON}>保存</Button>
                <Button onClick={clearJSON} type="outline" icon={<IconRefresh />}>清空</Button>
                <Button onClick={toGoStruct} type="outline" icon={<IconFire />}>转Go结构体</Button>
                <Button onClick={serialize} type="outline" icon={<IconAlignLeft />}>序列化</Button>
                <Button onClick={deserializeJSON} type="outline" icon={<IconAlignRight />}>反序列化</Button>
                <Button onClick={copy} type="outline" icon={<IconCopy />}>复制</Button>
            </Space>
        </div>
    </div>
}

export default App1
