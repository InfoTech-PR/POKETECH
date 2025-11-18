@echo off
echo Conectando-se ao servidor...
ssh -t tecnomaub-pokemon-gba@pokemon-gba.tecnomaub.site "cd htdocs && cd pokemon-gba.tecnomaub.site && git pull"
pause