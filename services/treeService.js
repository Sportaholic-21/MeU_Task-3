class ModelDiagramTree {
    constructor(model, alias = "") {
        this._model = model
        this._children = []
        this._as = alias
        this.createBelongsToDiagram()
    }

    insertNode(node) {
        this._children.push(node)
    }

    createBelongsToDiagram() {
        this._children = Object.values(this._model.associations).filter((val) => {
            return val.associationType == "BelongsTo"
        })
        if (this._children.length == 0) return
        for (var i in this._children) {
            this._children[i] = new ModelDiagramTree(this._children[i].target, this._children[i].as)
        }
    }

    belongsToDiagram(arr = [], level = 0, references = 'base', as = "") {
        if (level == 0) {
            arr[level] = {
                model: this._model,
                references: references
            }
        } else {
            if (arr[level] == undefined) arr[level] = []
            arr[level].push({
                model: this._model,
                references: references,
                as: as
            })
        }
        if (this._children.length > 0) {
            for (var i in this._children) {
                this._children[i].belongsToDiagram(arr, level + 1, this._model.name, this._children[i]._as)
            }
        }
        return arr
    }
}

module.exports = ModelDiagramTree