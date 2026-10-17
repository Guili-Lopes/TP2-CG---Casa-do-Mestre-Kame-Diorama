# 🐢 Kame House — Diorama em WebGL

> Trabalho Prático 2 de Computação Gráfica — um paraíso dentro da cápsula: a ilha do Mestre Kame, recriada em WebGL2.

🔗 **Cena publicada:** https://guili-lopes.github.io/TP2-CG---Casa-do-Mestre-Kame-Diorama/

📦 **Repositório:** https://github.com/Guili-Lopes/TP2-CG---Casa-do-Mestre-Kame-Diorama

🎬 **Vídeo:** 

---

## (a) A Cena

Uma pequena ilha tropical cercada por mar, apoiada sobre meia Esfera do Dragão gigante. No alto da ilha fica a **Kame House**, com seu catavento de galo girando conforme a direção do vento, rodeada de palmeiras, pedras, arbustos e grama. Na praia há um guarda-sol com canga e um píer de madeira entrando na água. O **Goku** tá na ilha em pé ao lado da casa, sentado na ponta do píer ou tirando um cochilo na canga, envolto em sua aura de ki e balançando o rabo, enquanto a **nuvem voadora** circula o diorama. O tempo passa, o dia vira noite e… talvez algo especial aconteça quando escurecer.

### Controles

| Tecla / Ação | Função |
|---|---|
| <kbd>1</kbd> | Câmera 1: a ~45º, girando em torno da ilha (scroll do mouse aproxima/afasta) |
| <kbd>2</kbd> | Câmera 2: orbital, controlada pelo mouse (arraste) |
| <kbd>3</kbd> | Câmera 3: navegação livre (<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> + mouse) |
| <kbd>P</kbd> | Alterna as poses do Goku |
| <kbd>L</kbd> | Liga/desliga a iluminação |
| <kbd>N</kbd> | Liga/desliga a neblina |
| <kbd>T</kbd> | Avança o tempo até a noite (ou até o dia) |
| <kbd>M</kbd> | Liga/desliga o som |

Todos os controles também estão disponíveis como botões na barra lateral.


### Tecnologias

WebGL2 puro com shaders GLSL ES 3.0, e a [TWGL.js](https://twgljs.org/) para utilitários de matrizes (`m4`) e geração de vértices de primitivas. Os modelos `.obj` são lidos por um carregador próprio, que separa as malhas por material.

---

## (b) Criador(es)

**Guilherme Lourenço Lopes** — Engenharia de Computação, CEFET-MG
- 📧 E-mail: guilhermellopes2004@gmail.com
- 💼 LinkedIn: _www.linkedin.com/in/guilherme-lourenço-lopes-692220212_
- 🐙 GitHub: [Guili-Lopes](https://github.com/Guili-Lopes)

---

## (c) Screenshots

| Dia | Noite |
|---|---|
| ![Kame House durante o dia](docs/screenshot-dia.png) | ![Kame House à noite](docs/screenshot-noite.png) |

![Visão lateral do diorama](docs/screenshot-lateral.png)

---

## (d) Opcionais


- [ ] **1. Neblina**
  > 🌟 Neblina: funcionalidade acrescentada por comando do teclado (N), podendo ser habilitada e desabilitada durante a execução

  _Na cena:_ névoa do mar com a cor do horizonte, alternada pela tecla <kbd>N</kbd>.

- [ ] **2. Música e efeitos sonoros**
  > 🌟 Música, efeitos sonoros e/ou som ambiente: inclua música de fundo, sons ambiente e efeitos sonoros (este último, caso haja algum tipo de interação)

  _Na cena:_ música de fundo (Cha-La Head-Cha-La na voz do autor), som ambiente de ondas e efeito sonoro quando as esferas do dragão surgem.

- [ ] **3. Skybox**
  > ⭐ Skybox, skyphere ou skydome: se considerarmos que nosso mundo está definido dentro de um cubo (skybox), podemos colocar uma imagem de textura em cada face interna (são 6) que represente o horizonte naquela direção. Veja exemplos de texturas de skyboxes e nossa aula sobre efeitos visuais. Repare que o cubo do skybox acompanha a posição, ou seja, não é possível se aproximar de uma parede, muito menos sair do cubo

  _Na cena:_ cubemap de céu em estilo anime, em versão de dia e de noite.

- [ ] **4. Efeitos de partículas**
  > 🍔 Efeitos de partículas: para simular fenômenos como fogo, fumaça, água etc. Falaremos disso na aula de efeitos visuais

  _Na cena:_ aura de ki em volta do Goku.

- [ ] **5. Fontes de luz pontuais**
  > Fontes de luz pontuais: coloque fontes de luz em alguns objetos do cenário (eg, luz no poste ou uma poça de gosma radioativa)

  _Na cena:_ lâmpada da varanda da casa e o brilho laranja das esferas do dragão à noite.

- [ ] **6. Poses alternativas**
  > Poses alternativas: ao alternar as poses do personagem com P, além de mudar a posição e orientação, coloque-o de fato em outra pose (eg, sentado, deitado, dormindo)

  _Na cena:_ Goku em pé ao lado da casa, sentado na ponta do píer e deitado tirando um cochilo na canga.

- [ ] **7. Vários tipos de objetos**
  > Vários tipos de objetos: em vez de compor o cenário com apenas 03 tipos de objetos, tenha uns 07 tipos diferentes para dar variedade

  _Na cena:_ casa, palmeira, pedra, arbusto, tufo de grama, guarda-sol com canga e píer.

- [ ] **8. Ciclo dia/noite**
  > 🍔 Ciclo dia/noite: faça o tempo passar e que isso defina na forma como o cenário é renderizado. Isso pode ser feito configurando-se a fonte de luz direcional com cores diferentes, dependendo da hora do dia
  >
  > Se tiver um skybox, você deve alterá-lo para refletir os horários diferentes

  _Na cena:_ a cor e a direção da luz direcional mudam com a hora, e o skybox transita entre dia e noite. A tecla <kbd>T</kbd> acelera o tempo até o próximo período.

- [ ] **9. Material transparente**
  > Material transparente: tenha algo como vidro ou outra coisa que seja semitransparente. Detalhe: objetos transparentes devem ser desenhados por último. Se fizer o opcional "Líquido", aí este não conta 2x

  _Na cena:_ os vidros das janelas da Kame House (objeto distinto da água).

- [ ] **10. Chão com relevo**
  > Chão com relevo: em vez de plano, faça com que o chão tenha relevo. Uma ideia é usar um height-map: uma textura em escala de cinza em que cada texel representa a altura do chão naquele pixel. Veja um exemplo de height map na aula sobre texturas

  _Na cena:_ o height map forma a própria ilha, a terra emerge no centro e afunda sob o mar nas bordas. Todos os objetos são apoiados no relevo.

- [ ] **11. Câmera de navegação livre**
  > ⭐ Câmera de navegação livre com WASD para voar e mouse para mudar direção

  _Na cena:_ terceira câmera, ativada pela tecla <kbd>3</kbd>.

- [ ] **12. Líquido**
  > Líquido: tenha uma região aquática como um lago, poça d'água, mar ou rio. Uma ideia para que um sólido pareça água é que ele (a) tenha certa transparência, (b) tenha uma textura com suas coordenadas animadas e (c-para oceano ou rio agitado) desloque verticalmente os vértices da superfície ao longo do tempo para criar ondas

  _Na cena:_ o mar em volta da ilha, com transparência, textura animada e ondas.

- [ ] **13. Vento**
  > ⭐ Vento: simule que existe vento e faça as coisas mexerem com ele. Por exemplo, aplique um shear com uma intensidade dada, em um certo momento, por uma textura que contém ruído branco (eg, perlin noise). Moitas de grama e a copa das árvores podem sofrer essa transformação

  _Na cena:_ shear com intensidade dada por uma textura de ruído nas folhas das palmeiras, nos arbustos e na grama; o galo do catavento gira acompanhando a direção do vento.

- [ ] **14. Modelos tridimensionais**
  > ⭐ Modelos tridimensionais: em vez de usar os sólidos próprios ou da TWGL.js, crie ou use modelos tridimensionais de terceiros e carregue-os no seu programa. Um formato simples é o .obj (mas ele não suporta animação). Tem também o formato glTF (mais complexo mas suporta animação)

  _Na cena:_ Kame House, Goku (nas três poses), palmeiras e pedras, carregados por um leitor de `.obj` próprio que separa as malhas por material.

### Detalhes extras

- **Objeto hierárquico:** o catavento da Kame House — a casa e a haste formam a estrutura fixa, e o galo é a parte giratória, desenhado como filho da casa na pilha de matrizes.
- **Personagem hierárquico:** o rabo do Goku é uma peça filha do corpo e oscila em torno da sua base.
- **Nuvem voadora:** orbita o diorama, subindo e descendo suavemente.

<details>
<summary> Easter egg (spoiler)</summary>

Quando a noite cai, as **7 esferas do dragão** surgem na areia em frente à casa, brilhando e iluminando os arredores com luz pontual. Use a tecla <kbd>T</kbd> para chegar lá mais rápido.

</details>

---

## (e) Créditos

### Modelos 3D

- **"Kame_house"** ([https://skfb.ly/pMPqp](https://skfb.ly/pMPqp)) by mich95 is licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/). _Modificado: convertido para .obj, galo do catavento separado e malha simplificada._
- **"Dragon Ball Kid Goku"** ([https://sketchfab.com/3d-models/dragon-ball-kid-goku-06eb27eb5a5e463997c80f4d26d0ad73](https://sketchfab.com/3d-models/dragon-ball-kid-goku-06eb27eb5a5e463997c80f4d26d0ad73)) by Tigerar1 (@allanromanreyes) — licença Free Standard _Modificado: normais corrigidas, poses criadas com o Mixamo e rabo separado._
- **"Palmeira Palm Tree"** ([https://skfb.ly/pOwnR](https://skfb.ly/pOwnR)) by Razzart_Games is licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/). _Modificado: convertido para .obj._
- **"Pedras"** ([https://skfb.ly/onAGQ](https://skfb.ly/onAGQ)) by Vitor Balbino is licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/). _Modificado: convertido para .obj e separado em duas pedras._

### Texturas e imagens

- **Height map da ilha** — criado pelo autor.
- **Texturas da ilha, das esferas do dragão, do hemisfério, do guarda-sol, da canga, da madeira, da casca, da folhagem, do ruído e da partícula** — geradas proceduralmente com auxílio do Claude (IA); a textura da ilha foi gerada a partir do height map do autor.
- **Skybox de dia:** "Skybox 05" ([https://freestylized.com/skybox/sky_05/](https://freestylized.com/skybox/sky_05/)) — FreeStylized, licença Royalty Free.
- **Skybox de noite:** "Skybox 87" ([https://freestylized.com/skybox/sky_87/](https://freestylized.com/skybox/sky_87/)) — FreeStylized, licença Royalty Free.
- **Textura da água:** "3 live procedurally generated tiling water textures" ([https://opengameart.org/node/10593](https://opengameart.org/node/10593)) — qubodup, licença [CC0](http://creativecommons.org/publicdomain/zero/1.0/).

### Sons

- **Música:** "Cha-La Head-Cha-La" — interpretação do autor; composição original de Chiho Kiyooka (música) e Yukinojo Mori (letra).
- **Ondas do mar:** "Ocean Waves" ([https://pixabay.com/pt/sound-effects/natureza-ocean-waves-562776/](https://pixabay.com/pt/sound-effects/natureza-ocean-waves-562776/)) — Pixabay, Licença de Conteúdo Pixabay.

### Código e ferramentas

- [TWGL.js](https://twgljs.org/), de Gregg Tavares — licença MIT.
- Utilitários `src/utils/shaders.js` e `src/utils/errors.js` baseados no exemplo [utf-cg-solar-system](https://github.com/fegemo/utf-cg-solar-system), do prof. Flávio Coutinho.
- [Blender](https://www.blender.org/) — conversão, separação e simplificação dos modelos.
- [Mixamo](https://www.mixamo.com/) — rig automático e poses do Goku.

---

_Dragon Ball e seus personagens pertencem a Akira Toriyama, Shueisha e Toei Animation. Este é um trabalho acadêmico, sem fins comerciais._
