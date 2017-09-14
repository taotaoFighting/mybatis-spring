package com.project.interctor;

import java.lang.reflect.Field;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.apache.ibatis.executor.parameter.ParameterHandler;
import org.apache.ibatis.executor.statement.RoutingStatementHandler;
import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.scripting.defaults.DefaultParameterHandler;



/**
 * mybatis拦截sql进行对应的分页处理�?�并将查询到的分页�?�条数返回到Page对象�?
 * @author lk
 *
 */
@Intercepts({ @Signature(method = "prepare", type = StatementHandler.class, args = { Connection.class }) })
public class PageInterceptor implements Interceptor {
    private String dialect ="";// 数据库方�?
    private String pageSqlId = ""; // mapper.xml中需要拦截的ID(正则匹配)
    

    /**
     * 拦截后要执行的方�?
     */
    public Object intercept(Invocation invocation) throws Throwable {
        // 对于StatementHandler其实只有两个实现类，�?个是RoutingStatementHandler，另�?个是抽象类BaseStatementHandler�?
        // BaseStatementHandler有三个子类，分别是SimpleStatementHandler，PreparedStatementHandler和CallableStatementHandler�?
        // SimpleStatementHandler是用于处理Statement的，PreparedStatementHandler是处理PreparedStatement的，而CallableStatementHandler�?
        // 处理CallableStatement的�?�Mybatis在进行Sql语句处理的时候都是建立的RoutingStatementHandler，�?�在RoutingStatementHandler里面拥有�?�?
        // StatementHandler类型的delegate属�?�，RoutingStatementHandler会依据Statement的不同建立对应的BaseStatementHandler，即SimpleStatementHandler�?
        // PreparedStatementHandler或CallableStatementHandler，在RoutingStatementHandler里面�?有StatementHandler接口方法的实现都是调用的delegate对应的方法�??
        // 我们在PageInterceptor类上已经用@Signature标记了该Interceptor只拦截StatementHandler接口的prepare方法，又因为Mybatis只有在建立RoutingStatementHandler的时�?
        // 是�?�过Interceptor的plugin方法进行包裹的，�?以我们这里拦截到的目标对象肯定是RoutingStatementHandler对象�?
        if (invocation.getTarget() instanceof RoutingStatementHandler) {
            RoutingStatementHandler statementHandler = (RoutingStatementHandler) invocation.getTarget();
            StatementHandler delegate = (StatementHandler) ReflectUtil.getFieldValue(statementHandler, "delegate");
            BoundSql boundSql = delegate.getBoundSql();
            Object obj = boundSql.getParameterObject();
            // 返回存在page的obj对象（主要查看pae是否在map对象里面�?
            obj = findPageObject(obj);
            if (obj instanceof Page<?>) {
                //System.out.println("---------分页-------");
                Page<?> page = (Page<?>) obj;
                // 通过反射获取delegate父类BaseStatementHandler的mappedStatement属�??
                MappedStatement mappedStatement = (MappedStatement) ReflectUtil.getFieldValue(delegate,
                        "mappedStatement");
                // 拦截到的prepare方法参数是一个Connection对象
                Connection connection = (Connection) invocation.getArgs()[0];
                // 获取当前要执行的Sql语句，也就是我们直接在Mapper映射语句中写的Sql语句
                String sql = boundSql.getSql();
                // 给当前的page参数对象设置总记录数
                Object parameterObj = boundSql.getParameterObject();
                this.setTotalRecord(page, parameterObj, mappedStatement, connection);
                // 获取分页Sql语句
                String pageSql = this.getPageSql(page, sql);
                // 利用反射设置当前BoundSql对应的sql属�?�为我们建立好的分页Sql语句
                ReflectUtil.setFieldValue(boundSql, "sql", pageSql);
            }
        }
        return invocation.proceed();
    }

    /**
     * 查找对象是否包括page�?
     * 
     * @param parameterObj
     * @return
     */
    public Page<?> findPageObject(Object parameterObj) {
        if (parameterObj instanceof Page<?>) {
            return (Page<?>) parameterObj;
        } else if (parameterObj instanceof Map) {
            for (Object val : ((Map<?, ?>) parameterObj).values()) {
                if (val instanceof Page<?>) {
                    return (Page<?>) val;
                }
            }
        }
        return null;
    }

    /**
     * 拦截器对应的封装原始对象的方�?
     */
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    /**
     * 根据page对象获取对应的分页查询Sql语句，这里只做了两种数据库类型，Mysql和Oracle 其它的数据库�? 没有进行分页
     *
     * @param page
     *            分页对象
     * @param sql
     *            原sql语句
     * @return
     */
    private String getPageSql(Page<?> page, String sql) {
        StringBuffer sqlBuffer = new StringBuffer(sql);
        if ("mysql".equalsIgnoreCase(dialect)) {
            return getMysqlPageSql(page, sqlBuffer);
        } else if ("oracle".equalsIgnoreCase(dialect)) {
            return getOraclePageSql(page, sqlBuffer);
        }
        return sqlBuffer.toString();
    }

    /**
     * 获取Mysql数据库的分页查询语句
     * 
     * @param page
     *            分页对象
     * @param sqlBuffer
     *            包含原sql语句的StringBuffer对象
     * @return Mysql数据库分页语�?
     */
    private String getMysqlPageSql(Page<?> page, StringBuffer sqlBuffer) {
        // 计算第一条记录的位置，Mysql中记录的位置是从0�?始的�?
        int offset = (int) ((page.getPageNo() - 1) * page.getPageSize());
        sqlBuffer.append(" limit ").append(offset).append(",").append(page.getPageSize());
        return sqlBuffer.toString();
    }

    /**
     * 获取Oracle数据库的分页查询语句
     * 
     * @param page
     *            分页对象
     * @param sqlBuffer
     *            包含原sql语句的StringBuffer对象
     * @return Oracle数据库的分页查询语句
     */
    private String getOraclePageSql(Page<?> page, StringBuffer sqlBuffer) {
        // 计算第一条记录的位置，Oracle分页是�?�过rownum进行的，而rownum是从1�?始的
        int offset = (int) ((page.getPageNo() - 1) * page.getPageSize() + 1);
        sqlBuffer.insert(0, "select u.*, rownum r from (").append(") u where rownum < ")
                .append(offset + page.getPageSize());
        sqlBuffer.insert(0, "select * from (").append(") where r >= ").append(offset);
        // 上面的Sql语句拼接之后大概是这个样子：
        // select * from (select u.*, rownum r from (select * from t_user) u
        // where rownum < 31) where r >= 16
        return sqlBuffer.toString();
    }

    /**
     * 给当前的参数对象page设置总记录数
     *
     * @param page
     *            Mapper映射语句对应的参数对�?
     * @param mappedStatement
     *            Mapper映射语句
     * @param connection
     *            当前的数据库连接
     */
    private void setTotalRecord(Page<?> page, Object parameterObject, MappedStatement mappedStatement,
            Connection connection) {
        BoundSql boundSql = mappedStatement.getBoundSql(page);
        String sql = boundSql.getSql();
        String countSql = this.getCountSql(sql);
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        BoundSql countBoundSql = new BoundSql(mappedStatement.getConfiguration(), countSql, parameterMappings,
                parameterObject);
        ParameterHandler parameterHandler = new DefaultParameterHandler(mappedStatement, parameterObject,
                countBoundSql);
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            pstmt = connection.prepareStatement(countSql);
            // 通过parameterHandler给PreparedStatement对象设置参数
            parameterHandler.setParameters(pstmt);
            // 之后就是执行获取总记录数的Sql语句和获取结果了�?
            rs = pstmt.executeQuery();
            if (rs.next()) {
                int totalRecord = rs.getInt(1);
                // 给当前的参数page对象设置总记录数
                page.setTotal(totalRecord);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null)
                    rs.close();
                if (pstmt != null)
                    pstmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 根据原Sql语句获取对应的查询�?�记录数的Sql语句
     * 
     * @param sql
     * @return
     */
    private String getCountSql(String sql) {
        int index = sql.indexOf("from");
        //int endIndex=sql.indexOf("limit");
        return "select count(*) " + sql.substring(index);
    }

    /**
     * 设置注册拦截器时设定的属�?
     */
    public void setProperties(Properties p) {

    }

    public String getDialect() {
        return dialect;
    }

    public void setDialect(String dialect) {
        this.dialect = dialect;
    }

    public String getPageSqlId() {
        return pageSqlId;
    }

    public void setPageSqlId(String pageSqlId) {
        this.pageSqlId = pageSqlId;
    }

    /**
     * 利用反射进行操作的一个工具类
     *
     */
    private static class ReflectUtil {
        /**
         * 利用反射获取指定对象的指定属�?
         * 
         * @param obj
         *            目标对象
         * @param fieldName
         *            目标属�??
         * @return 目标属�?�的�?
         */
        public static Object getFieldValue(Object obj, String fieldName) {
            Object result = null;
            Field field = ReflectUtil.getField(obj, fieldName);
            if (field != null) {
                field.setAccessible(true);
                try {
                    result = field.get(obj);
                } catch (IllegalArgumentException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
            return result;
        }

        /**
         * 利用反射获取指定对象里面的指定属�?
         * 
         * @param obj
         *            目标对象
         * @param fieldName
         *            目标属�??
         * @return 目标字段
         */
        private static Field getField(Object obj, String fieldName) {
            Field field = null;
            for (Class<?> clazz = obj.getClass(); clazz != Object.class; clazz = clazz.getSuperclass()) {
                try {
                    field = clazz.getDeclaredField(fieldName);
                    break;
                } catch (NoSuchFieldException e) {
                    // 这里不用做处理，子类没有该字段可能对应的父类有，都没有就返回null�?
                }
            }
            return field;
        }

        /**
         * 利用反射设置指定对象的指定属性为指定的�??
         * 
         * @param obj
         *            目标对象
         * @param fieldName
         *            目标属�??
         * @param fieldValue
         *            目标�?
         */
        public static void setFieldValue(Object obj, String fieldName, String fieldValue) {
            Field field = ReflectUtil.getField(obj, fieldName);
            if (field != null) {
                try {
                    field.setAccessible(true);
                    field.set(obj, fieldValue);
                } catch (IllegalArgumentException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
        }

        /**
         * 利用反射设置指定对象的指定属性为指定的�??
         * 
         * @param obj
         *            目标对象
         * @param fieldName
         *            目标属�??
         * @param fieldValue
         *            目标�?
         */
        public static void setFieldValue(Object obj, String fieldName, Object fieldValue) {
            Field field = ReflectUtil.getField(obj, fieldName);
            if (field != null) {
                try {
                    field.setAccessible(true);
                    field.set(obj, fieldValue);
                } catch (IllegalArgumentException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }

    }
}
