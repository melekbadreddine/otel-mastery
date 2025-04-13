default: dry-run

NAMESPACE=octoperf
RELEASE ?= kubernetes-agent
HELM_PARAMS=-f values.yaml --namespace $(NAMESPACE)

dry-run:
	helm install $(HELM_PARAMS) --dry-run

install:
	helm install $(RELEASE) octoperf/kubernetes-agent $(HELM_PARAMS)

get-all:
	kubectl -n octoperf get all

purge:
	helm del --purge $(RELEASE)

clean:
	-helm delete $(RELEASE)
	-helm del --purge $(RELEASE)
