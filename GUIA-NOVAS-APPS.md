# Guia: Como Hospedar uma Nova Aplicacao no windlog.org

## Arquitetura

```
Internet → Cloudflare (SSL) → Tunnel → cloudflared → Traefik (:80) → Container
```

- **Traefik** faz o roteamento baseado no subdominio (Host header)
- **Cloudflare Tunnel** cuida do SSL e da conexao sem abrir portas
- Cada app roda em seu proprio container Docker na rede `proxy-net`

---

## Passo a Passo

### 1. Criar o diretorio da aplicacao no servidor

Acesse o servidor via SSH:

```bash
ssh windlog
```

Crie o diretorio (substitua `minhaapp` pelo nome da sua app):

```bash
sudo mkdir -p /opt/windlog/minhaapp
```

---

### 2. Criar o docker-compose.yml

Dentro do diretorio da app, crie o arquivo `docker-compose.yml`:

```bash
sudo nano /opt/windlog/minhaapp/docker-compose.yml
```

Use o modelo abaixo (substitua os valores marcados com `<>`):

```yaml
services:
  minhaapp:
    image: <imagem-docker>          # Ex: nginx:alpine, node:20, python:3.12
    container_name: minhaapp
    restart: unless-stopped
    # environment:                   # Descomente se precisar de variaveis de ambiente
    #   VARIAVEL: "valor"
    # volumes:                       # Descomente se precisar de persistencia
    #   - minhaapp_data:/caminho/no/container
    networks:
      - proxy-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minhaapp.rule=Host(`minhaapp.windlog.org`)"
      - "traefik.http.routers.minhaapp.entrypoints=web"
      - "traefik.http.services.minhaapp.loadbalancer.server.port=<porta-interna>"

networks:
  proxy-net:
    external: true

# volumes:                           # Descomente se precisar de persistencia
#   minhaapp_data:
```

**Campos que voce precisa alterar:**

| Campo | O que colocar | Exemplo |
|---|---|---|
| `image` | Imagem Docker da sua app | `nginx:alpine`, `node:20-alpine` |
| `container_name` | Nome unico do container | `minhaapp` |
| `Host(...)` | Subdominio desejado | `minhaapp.windlog.org` |
| `server.port` | Porta interna da app | `80`, `3000`, `8080` |
| `environment` | Variaveis de ambiente (se necessario) | `DATABASE_URL=...` |
| `volumes` | Persistencia de dados (se necessario) | `./data:/app/data` |

> **IMPORTANTE:** Os nomes do router e service (`minhaapp` nas labels) devem ser unicos para cada aplicacao. Use sempre o nome da app.

---

### 3. Deploy da aplicacao

```bash
sudo docker compose -f /opt/windlog/minhaapp/docker-compose.yml up -d
```

Verifique se o container esta rodando:

```bash
sudo docker ps
```

Verifique os logs se algo der errado:

```bash
sudo docker compose -f /opt/windlog/minhaapp/docker-compose.yml logs -f
```

---

### 4. Configurar o Cloudflare Tunnel

No painel do Cloudflare:

1. Vá em **Zero Trust** > **Networks** > **Tunnels**
2. Selecione o tunel ativo
3. Na aba **Public Hostnames**, clique em **"Add a public hostname"**
4. Preencha:

| Campo | Valor |
|---|---|
| Subdomain | `minhaapp` |
| Domain | `windlog.org` |
| Type | `HTTP` |
| URL | `localhost:80` |

5. Clique em **Save**

> **Nota:** Se aparecer erro de registro DNS existente, va em **DNS > Records**, delete o registro conflitante e tente novamente.

---

### 5. Testar

Acesse no navegador:

```
https://minhaapp.windlog.org
```

---

## Exemplos Praticos

### Exemplo 1: Aplicacao Node.js

```yaml
services:
  meuapp:
    image: node:20-alpine
    container_name: meuapp
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install && npm start"
    environment:
      NODE_ENV: production
      PORT: "3000"
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    networks:
      - proxy-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.meuapp.rule=Host(`meuapp.windlog.org`)"
      - "traefik.http.routers.meuapp.entrypoints=web"
      - "traefik.http.services.meuapp.loadbalancer.server.port=3000"

networks:
  proxy-net:
    external: true
```

### Exemplo 2: Aplicacao Python (Flask/Django)

```yaml
services:
  pyapp:
    image: python:3.12-slim
    container_name: pyapp
    restart: unless-stopped
    working_dir: /app
    command: sh -c "pip install -r requirements.txt && python app.py"
    environment:
      FLASK_ENV: production
    volumes:
      - ./src:/app
    networks:
      - proxy-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pyapp.rule=Host(`pyapp.windlog.org`)"
      - "traefik.http.routers.pyapp.entrypoints=web"
      - "traefik.http.services.pyapp.loadbalancer.server.port=5000"

networks:
  proxy-net:
    external: true
```

### Exemplo 3: Site estatico (HTML/CSS)

```yaml
services:
  site:
    image: nginx:alpine
    container_name: site
    restart: unless-stopped
    volumes:
      - ./html:/usr/share/nginx/html:ro
    networks:
      - proxy-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.site.rule=Host(`site.windlog.org`)"
      - "traefik.http.routers.site.entrypoints=web"
      - "traefik.http.services.site.loadbalancer.server.port=80"

networks:
  proxy-net:
    external: true
```

---

## Comandos Uteis

| Acao | Comando |
|---|---|
| Iniciar app | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml up -d` |
| Parar app | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml down` |
| Reiniciar app | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml restart` |
| Ver logs | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml logs -f` |
| Ver todos containers | `sudo docker ps` |
| Reconstruir app | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml up -d --build` |
| Atualizar imagem | `sudo docker compose -f /opt/windlog/<app>/docker-compose.yml pull && sudo docker compose -f /opt/windlog/<app>/docker-compose.yml up -d` |

---

## Estrutura de Diretorios no Servidor

```
/opt/windlog/
├── traefik/          # Reverse proxy (nao modificar)
│   ├── docker-compose.yml
│   └── traefik.yml
├── postgres/         # Banco de dados (nao modificar)
│   └── docker-compose.yml
├── pgadmin/          # Gerenciador do banco (nao modificar)
│   └── docker-compose.yml
├── landing/          # Pagina inicial windlog.org
│   ├── docker-compose.yml
│   └── index.html
├── minhaapp/         # <-- Sua nova app aqui
│   └── docker-compose.yml
└── ...               # Outras apps
```

---

## Checklist Rapido

- [ ] Diretorio criado em `/opt/windlog/<nome-da-app>/`
- [ ] `docker-compose.yml` com labels do Traefik configuradas
- [ ] Router e service com nomes unicos nas labels
- [ ] Container na rede `proxy-net`
- [ ] Container rodando (`docker ps`)
- [ ] Public Hostname adicionado no Cloudflare Tunnel
- [ ] Testado no navegador

---

## Problemas Comuns

**404 do Traefik:** O container nao foi detectado. Verifique:
- O container esta na rede `proxy-net`?
- A label `traefik.enable=true` esta presente?
- O nome do Host nas labels bate com o subdominio configurado?
- Reinicie o Traefik: `sudo docker restart traefik`

**522 do Cloudflare:** O tunel nao alcanca o servidor. Verifique:
- O Public Hostname esta configurado no tunel?
- O servico aponta para `http://localhost:80`?

**504 Gateway Timeout:** A app nao responde. Verifique:
- A porta interna na label `server.port` esta correta?
- A app esta realmente escutando nessa porta? (`sudo docker logs <container>`)
