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
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    sauce.findOne({_id: req.params.id})
        .then((sauceResult) => {
            if (sauceResult.userId.toString() !== sauceObject.userId) {
                res.status(401).json({ message : 'Vous ne pouvez pas modifié cette sauce'});
            } else {
                sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifié!'}))
                .catch(error => res.status(401).json({ error }));
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

 exports.likeDislikeSauce = (req, res, next) => {
    let like = req.body.like
    let userId = req.body.userId
    let sauceId = req.params.id
    
    switch (like) {
      case 1 :
          sauce.updateOne({ _id: sauceId }, { $push: { usersLiked: userId }, $inc: { likes: +1 }})
            .then(() => res.status(200).json({ message: `J'aime` }))
            .catch((error) => res.status(400).json({ error }))
              
        break;
  
      case 0 :
          sauce.findOne({ _id: sauceId })
             .then((Sauce) => {
              if (Sauce.usersLiked.includes(userId)) { 
                sauce.updateOne({ _id: sauceId }, { $pull: { usersLiked: userId }, $inc: { likes: -1 }})
                  .then(() => res.status(200).json({ message: `Neutre` }))
                  .catch((error) => res.status(400).json({ error }))
              }
              if (Sauce.usersDisliked.includes(userId)) { 
                sauce.updateOne({ _id: sauceId }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 }})
                  .then(() => res.status(200).json({ message: `Neutre` }))
                  .catch((error) => res.status(400).json({ error }))
              }
            })
            .catch((error) => res.status(404).json({ error }))
        break;
  
      case -1 :
          sauce.updateOne({ _id: sauceId }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 }})
            .then(() => { res.status(200).json({ message: `Je n'aime pas` }) })
            .catch((error) => res.status(400).json({ error }))
        break;
        
        default:
          console.log(error);
    }
  }