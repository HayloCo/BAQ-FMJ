"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const port = 3000;
const io = new socket_io_1.Server(server);
app.use(express_1.default.static(path_1.default.resolve(__dirname, './client')));
io.on('connection', (socket) => {
    console.log('a user connected');
});
app.get('*', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, './client', 'index.html'));
});
app.listen(port, () => {
    console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map