import printByte from "./printByte";

function printBuffer(content: number[] | Uint8Array | Buffer): string {
    const prettyList: string[] = [];
    content.forEach((e: number) => {
        prettyList.push("$" + printByte(e));
    });
    return prettyList.join(" ");
}

export default printBuffer;
