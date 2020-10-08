#!/bin/bash

echo What is the docker container version number?
read VERSION

docker build -t stevenmchenry01/thequad:$VERSION .
docker push stevenmchenry01/thequad:$VERSION

ssh root@165.227.31.212 "docker pull stevenmchenry01/thequad:$VERSION && docker tag stevenmchenry01/thequad:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"