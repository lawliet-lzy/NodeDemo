var mysql = require('mysql');
var $conf = require('../conf/db');
var $util = require('../util/util');
var $sql = require('./userSqlMapping');

// 使用连接池，提升性能
var pool = mysql.createPool($util.extend({}, $conf.mysql))

// 向前台返回JSON方法的简单封装
var jsonWrite = function (res, ret) {
	if(typeof ret === 'undefined') {
		res.json({
			code:'1',
			msg: '操作失败'
		});
	} else {
		res.json(ret);
	}
};

module.exports = {
	add: function (req, res, next) {
		pool.getConnection(function(err, connection) {
			// 获取前台页面传过来的参数
			var param = req.query || req.params;
 
			// 建立连接，向表中插入值
			// 'INSERT INTO user(id, name, age) VALUES(0,?,?)',
			connection.query($sql.insert, [param.name, param.age], function(err, result) {
        console.log('add', result)
        if(result) {
					result = {
						code: 200,
						msg:'增加成功'
					};    
				}
 
				// 以json形式，把操作结果返回给前台页面
				jsonWrite(res, result);
 
				// 释放连接 
				connection.release();
			});
		});
  },
  delete: function(req, res) {
    pool.getConnection(function(err, connection){
      var param = req.query || req.params;

      connection.query($sql.delete, +param.id,function(err, result) {
        if(result) {
					result = {
						code: 200,
						msg:'删除成功'
					};
        }
        // 以json形式，把操作结果返回给前台页面
        jsonWrite(res, result);
        
        // 释放连接 
				connection.release();
      })
    })
  },
  update: function(req, res, next) {
    var param = req.body;
    console.log('update', param)
    if(param.name == null || param.age == null || param.id == null){
      jsonWrite(res, underfined)
      return
    }

    pool.getConnection(function(err, connection) {
      connection.query($sql.update, [param.name, param.age, +param.id],function(err, result){
        if(result){
          console.log('result.affectedRows', result.affectedRows)
          if(result.affectedRows > 0) {
            res.render('success', {
              result: result
            })
          } else {
            res.render('fail', {
              result: result
            })
          }
        }

        connection.release();
      })
    })
  },
  queryById: function(req, res, next) {
    var id = +req.query.id;
    pool.getConnection($sql.queryById, id, function(err, result){
      jsonWrite(res, result)
      connection.release();
    })
  },
  queryAll: function(req, res, next) {
    var id = +req.query.id;
    pool.getConnection($sql.queryAll, id, function(err, result) {
      jsonWrite(res, result)
      connection.release();
    })
  }
};
