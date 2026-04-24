{pkgs}: {
  channel = "stable-25.05";
  packages = [
    pkgs.nodejs_latest
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
  idx.workspace.onCreate = {
    npm-install = "npm i";
    nx-install = "npm i -g nx@latest";
  };
  idx.previews = {
    previews = {
      web = {
        command = [
          "nx"
          "run"
          "angular-plg:serve"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}