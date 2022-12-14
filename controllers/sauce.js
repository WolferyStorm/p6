const sauce = require('../models/sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
  };
exports.getOneSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
  };
exports.createSauce =(req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const Sauce = new sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes:0,
        dislikes:0,
        usersLiked: [],
        usersDisliked:[]
    });
    Sauce.save()
      .then(() => res.status(201).json({ message: 'Sauce enregistré !'}))
      .catch(error => res.status(400).json({ error }));
  };
exports.modifySauce =(req, res, next) => {
    sauce.findOne({_id: req.params.id})
        .then((sauceResult) => {
            if (sauceResult.userId.toString() !== req.auth.userId) {
                res.status(401).json({ message : 'Vous ne pouvez pas modifié cette sauce'});
            } else {
                const filename = sauceResult.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    const sauceObject = req.file ? {
                        ...JSON.parse(req.body.sauce),
                        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                    } : { ...req.body };
                sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifié!'}))
                .catch(error => res.status(401).json({ error }));
                })
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
    
 };
exports.deleteSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Utilisateur non autorisé'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    sauce.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Sauce supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

 exports.like = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(sauceResult => {
            if (req.body.like === 1) {
                // on like
                let index = sauceResult.usersLiked.indexOf(req.body.userId)
                if (!index > -1) {
                    sauceResult.likes++
                        sauceResult.usersLiked.push(req.body.userId)
                }
            } else if (req.body.like === 0) {
                // on annule le like
                let index = sauceResult.usersLiked.indexOf(req.body.userId)
                if (index > -1) {
                    if (sauceResult.likes > 0) {
                        sauceResult.likes--
                    }
                    sauceResult.usersLiked.splice(index, 1)
                }
            } else {
                // like = -1
                if (sauceResult.likes > 0) {
                    sauceResult.likes--
                }

                let indexDislike = sauceResult.usersDisliked.indexOf(req.body.userId)
                if (!indexDislike > -1) {
                    sauceResult.dislikes++
                        sauceResult.usersDisliked.push(req.body.userId)
                }

                //    on verifie s'il avait déjà liker
                let index = sauceResult.usersLiked.indexOf(req.body.userId)
                if (index > -1) {
                    sauceResult.usersLiked.splice(req.body.userId)
                }
            }

            sauce.updateOne({ _id: req.params.id }, sauceResult)
                .then(() => res.status(201).json({ message: 'Objet Modfié' }))
                .catch(error => res.status(500).json({ error }))
        })
}