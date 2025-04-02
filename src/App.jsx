import React, { useEffect, useState } from "react";
import "jsoneditor/dist/jsoneditor.css";
import "@arco-design/web-react/dist/css/arco.css";
import { Button, Modal, Space, Message, Input, Grid, List, ResizeBox } from "@arco-design/web-react";
import { writeTextFile, BaseDirectory, readTextFile, exists, create, mkdir } from '@tauri-apps/plugin-fs';
import { IconSave, IconImport, IconFire, IconAlignLeft, IconRefresh, IconAlignRight, IconCopy, IconEdit, IconDelete } from "@arco-design/web-react/icon";
import JSONEditor from 'jsoneditor';
import dayjs from "dayjs";
import { save, open } from '@tauri-apps/plugin-dialog';
import invoke from "@/util/invoke";
import jsonToGo from "@/util/json-to-go";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import sqlite from "@/util/sqlite";
const Row = Grid.Row;
const Col = Grid.Col;
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

var superDecode = (value) => {
    let dataType = typeof value
    if (dataType == 'string') {
        try {
            let data = JSON.parse(value)
            return superDecode(data)
        } catch (e) {
            return value
        }
    }

    if (dataType == 'object') {
        if (value.length == undefined) {
            let keys = Object.keys(value)
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i]
                value[key] = superDecode(value[key])
            }
            return value
        }
        for (let i = 0; i < value.length; i++) {
            value[i] = superDecode(value[i])
        }
    }

    return value
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
    const [jsonList, setJsonList] = useState([])

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
        sqlite.queryJSONData().then((result) => {
            setJsonList(result)
        })
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

    var superParse = () => {
        try {
            let data = superDecode(JSON.parse(editor.getText()))
            editor.set(data)
        } catch (e) {
            Message.error("Super Decode failure")
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

    var getJsonList = async () => {
        let result = await sqlite.queryJSONData()
        setJsonList(result)
    }

    var saveJSON2Sqlite = async () => {
        let data = JSON.stringify(editor.get())
        let name = data
        if (data.length > 30) {
            name = data.substring(0, 30)
        }
        let result = await sqlite.addJSONData(name, data)
        await getJsonList()
    }

    var deleteJSON = async (item) => {
        console.log(item)
    }

    return <div>
        <ResizeBox.Split
            direction={'horizontal'}
            style={{
                border: '1px solid var(--color-border)',
            }}
            size={0.2}
            max={0.8}
            min={0.2}
            panes={[
                <List style={{ padding: "3px" }} dataSource={jsonList} size={'small'}
                    render={(item, index) => {
                        return <List.Item key={index} actions={[
                            <span onClick={deleteJSON.bind(this, item)}>
                                <IconEdit />
                            </span>,
                            <span onClick={deleteJSON.bind(this, item)}>
                                <IconDelete />
                            </span>,
                        ]}>
                            {item.name}
                        </List.Item>
                    }}
                />,
                <div>
                    <div style={{ height: jsonHeight }} id="jsoneditor" ></div>
                    <div style={{ textAlign: "center", marginTop: "15px" }}>
                        <Space wrap={true}>
                            <Button onClick={loadJSON} type="outline" icon={<IconImport />}>文件加载</Button>
                            <Button type="outline" icon={<IconSave />} onClick={saveJSON2Sqlite}>保存</Button>
                            <Button onClick={clearJSON} type="outline" icon={<IconRefresh />}>清空</Button>
                            <Button onClick={toGoStruct} type="outline" icon={<IconFire />}>转Go结构体</Button>
                            <Button onClick={serialize} type="outline" icon={<IconAlignLeft />}>Stringify</Button>
                            <Button onClick={deserializeJSON} type="outline" icon={<IconAlignRight />}>Parse</Button>
                            <Button onClick={superParse} type="outline" icon={<IconAlignRight />}>SuperParse</Button>
                            <Button onClick={copy} type="outline" icon={<IconCopy />}>复制</Button>
                        </Space>
                    </div>
                </div>
            ]}
        />

    </div >
}

export default App1
