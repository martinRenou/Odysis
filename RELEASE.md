- To release a new version of odysis on NPM:

```
git clean -fdx

npm version patch/minor/major
npm install
npm publish
```

- To release a new version of odysis on PyPI:

Update _version.py
git add the _version.py file and git commit

```
python setup.py sdist upload
python setup.py bdist_wheel

# Upload on PyPi
twine upload dist/*
```

```
git tag -a X.X.X -m 'comment'

git push origin/upstream master
git push origin/upstream X.X.X
```
