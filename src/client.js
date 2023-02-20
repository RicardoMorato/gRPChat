const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, "chat.proto"),
  {}
);
const grpcObject = grpc.loadPackageDefinition(packageDef);

const chatPackage = grpcObject.chatPackage;

const username = process.argv[2];

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!username) {
  console.log(
    "Por favor, utilize o seguinte padrão para que a aplicacao funcione corretamente:\n"
  );
  console.log("Em que <usernme> será o seu nome de usuário no chat\n");

  throw new Error("WrongInitialization");
} else {
  const metadata = new grpc.Metadata();
  metadata.add("username", username);

  const client = new chatPackage.Chat(
    "0.0.0.0:4000",
    grpc.credentials.createInsecure()
  );

  const call = client.chat(metadata);

  call.on("data", (ChatMessage) => {
    console.log(`${ChatMessage.from} ==> ${ChatMessage.msg}`);
  });

  call.on("end", () => {
    console.log("Server ended call");
  });
  call.on("error", (e) => {
    console.log(e);
  });

  rl.on("line", (data) => {
    if (data === "sair") {
      call.end();
      rl.close();
    } else {
      call.write({
        from: username,
        msg: data,
      });
    }
  });
}
