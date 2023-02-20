const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, "chat.proto"),
  {}
);
const grpcObject = grpc.loadPackageDefinition(packageDef);

const chatPackage = grpcObject.chatPackage;

const server = new grpc.Server();

const clients = new Map();

function chat(call) {
  const username = call.metadata.get("username");

  if (clients.get(username) === undefined) {
    call.write({
      from: "Servidor",
      msg: `O chat que você entrou possui ${clients.size} membro(s) online\nDigite suas mensagens abaixo, para sair do chat, escreva 'sair'\n`,
    });

    broadcast("Servidor", `${username} entrou no chat!`);

    clients.set(username, call);
  }

  call.on("data", function (ChatMessage) {
    const user = ChatMessage.from;
    const msg = ChatMessage.msg;

    console.log(`${user} ==> ${msg}`);

    broadcast(user, msg);
  });

  call.on("end", function () {
    const username = call.metadata.get("username");
    const message = `${username} saiu do chat`;

    broadcast("Servidor", message);
    console.log(`Servidor ==> ${message}`);

    call.write({
      from: "Servidor",
      msg: "Foi bom te ver, até mais!\n",
    });

    call.end();
  });
}

function broadcast(user, message) {
  for (let [msgUser, userCall] of clients) {
    if (msgUser[0] !== user) {
      userCall.write({
        from: user,
        msg: `${message}\n`,
      });
    }
  }
}

server.bind("0.0.0.0:4000", grpc.ServerCredentials.createInsecure());
server.addService(chatPackage.Chat.service, {
  chat,
});
server.start();
