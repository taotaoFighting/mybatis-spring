package com.project.interctor;

import com.alibaba.fastjson.annotation.JSONField;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 分页封装的page�?
 * @author lk
 */
public class Page<T> {
    /**
     * 默认每页记录�?
     */
    @JSONField(serialize = false)
    private  int DEFAULT_LIMIT = 10;


    /**
     * 取数据偏�?
     * Rest Api使用
     */
    private long offset = 0;

    /**
     * 总数据量
     */
    private long total = 0;

    /**
     * 取数据数�?
     * Rest Api使用
     */
    private int limit = DEFAULT_LIMIT;

    /**
     * 查询数据结果
     */
    private List<T> result = new ArrayList<T>();

    /**
     * 查询条件存放�?
     */
    private Map<String, Object> filter = new HashMap<String, Object>();
    
    /**
     * 当前页数
     */
    private long pageNo;
    
    /**
     * 每页多少�?
     * @return
     */
    
    private int pageSize;


    @JSONField(serialize = false)
    public long getPage() {
        return (offset / limit) + 1;
    }

    public void setPage(long page) {
        offset = (page - 1) * limit;
    }

    public void setPage(Long page) {
        setPage(page != null ? page.longValue() : 1);
    }

    @JSONField(serialize = false)
    public long getTotalPage() {
        if (total < 0) {
            return -1;
        }
        long count = total / limit;
        if (total % limit != 0) {
            count++;
        }
        if(count==0){
            count=1;
        }
        return count;
    }

    public long getOffset() {
        return offset;
    }

    public void setOffset(long offset) {
        this.offset =  (offset - 1) * limit;;
    }

    public void setOffset(Long offset) {
        setOffset(offset != null ? offset.longValue() : 0);
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        if (limit <= 0) {
            limit = DEFAULT_LIMIT;
        }
        this.limit = limit; 
    }

    public void setLimit(Integer limit) {
        setLimit(limit != null ? limit.intValue() : DEFAULT_LIMIT);
    }

    public List<T> getResult() {
        return result;
    }

    public void setResult(List<T> result) {
        this.result = result;
    }

    public Map<String, Object> getFilter() {
        return filter;
    }

    public void setFilter(Map<String, Object> filter) {
        this.filter = filter;
    }


    private String keyWords;

    public void setKeyWords(String keyWords) {
        this.keyWords = keyWords;
    }

    public String getKeyWords() {
        return keyWords;
    }

	public long getPageNo() {
		return pageNo;
	}

	public void setPageNo(long pageNo) {
		this.pageNo = pageNo;
		this.offset =  (pageNo - 1) * limit;
	}

	public int getPageSize() {
		return pageSize;
	}

	public void setPageSize(int pageSize) {
		this.pageSize = pageSize;
		 this.limit = pageSize; 
		 this.offset =  (pageNo - 1) * limit;
		
	}
    
    
    
}