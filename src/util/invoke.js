import { invoke } from '@tauri-apps/api/core';

var writeFile = async (file, content) => {
    let Result = await invoke('write_file', {
        name: file, content: content,
    })
    return Result
}

var readFile = async (file, content) => {
    let Result = await invoke('read_file', {
        name: file, content: content,
    })
    return Result
}



export {
    writeFile, readFile
}

export default {
    writeFile, readFile
}
