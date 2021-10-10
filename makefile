# pull in from dotenv
include .env
export

DOCKER_TAG_NAME = rxn-core
REMOTE = dev.kagelabs.org
REMOTE_DESTINATION = projects/rxn
STAGING = staging
SSH_TOOL = mosh

all: watch

run:
	node server.js

watch:
	npx nodemon server.js

init:
	npm install

clean:
	rm -rf ${STAGING}

init-db:
	cat schema.sql | sqlite3 ${DATABASE}

build:
	docker build . -t ${DOCKER_TAG_NAME}

run-docker: build
	docker-compose up

export: clean build
	mkdir -p ${STAGING}
	docker save ${DOCKER_TAG_NAME} -o ${STAGING}/${DOCKER_TAG_NAME}.tar
	gzip ${STAGING}/${DOCKER_TAG_NAME}.tar

deploy:
	ssh -t ${REMOTE} 'cd ${REMOTE_DESTINATION}; sudo docker-compose stop; sudo docker load -i ${DOCKER_TAG_NAME}.tar; sudo docker-compose up -d;'


init-deploy:
	ssh -t ${REMOTE} 'mkdir -p ${REMOTE_DESTINATION}'
	scp docker-compose.yml ${REMOTE}:${REMOTE_DESTINATION}
	-scp -r instance ${REMOTE}:${REMOTE_DESTINATION}
	-scp .env ${REMOTE}:${REMOTE_DESTINATION}

upload: export
	rsync -avz --progress ${STAGING}/${DOCKER_TAG_NAME}.tar.gz ${REMOTE}:${REMOTE_DESTINATION}/${DOCKER_TAG_NAME}.tar.gz
	ssh -t ${REMOTE} 'gzip -df ${REMOTE_DESTINATION}/${DOCKER_TAG_NAME}.tar.gz'


connect:
	${SSH_TOOL} ${REMOTE}

