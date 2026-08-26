package com.iptv.business.grpc.docreader;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.68.1)",
    comments = "Source: docreader.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class DocReaderGrpc {

  private DocReaderGrpc() {}

  public static final java.lang.String SERVICE_NAME = "docreader.DocReader";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest,
      com.iptv.business.grpc.docreader.ReadResponse> getReadMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Read",
      requestType = com.iptv.business.grpc.docreader.ReadRequest.class,
      responseType = com.iptv.business.grpc.docreader.ReadResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest,
      com.iptv.business.grpc.docreader.ReadResponse> getReadMethod() {
    io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest, com.iptv.business.grpc.docreader.ReadResponse> getReadMethod;
    if ((getReadMethod = DocReaderGrpc.getReadMethod) == null) {
      synchronized (DocReaderGrpc.class) {
        if ((getReadMethod = DocReaderGrpc.getReadMethod) == null) {
          DocReaderGrpc.getReadMethod = getReadMethod =
              io.grpc.MethodDescriptor.<com.iptv.business.grpc.docreader.ReadRequest, com.iptv.business.grpc.docreader.ReadResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Read"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ReadRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ReadResponse.getDefaultInstance()))
              .setSchemaDescriptor(new DocReaderMethodDescriptorSupplier("Read"))
              .build();
        }
      }
    }
    return getReadMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest,
      com.iptv.business.grpc.docreader.ReadStreamResponse> getReadStreamMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ReadStream",
      requestType = com.iptv.business.grpc.docreader.ReadRequest.class,
      responseType = com.iptv.business.grpc.docreader.ReadStreamResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest,
      com.iptv.business.grpc.docreader.ReadStreamResponse> getReadStreamMethod() {
    io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ReadRequest, com.iptv.business.grpc.docreader.ReadStreamResponse> getReadStreamMethod;
    if ((getReadStreamMethod = DocReaderGrpc.getReadStreamMethod) == null) {
      synchronized (DocReaderGrpc.class) {
        if ((getReadStreamMethod = DocReaderGrpc.getReadStreamMethod) == null) {
          DocReaderGrpc.getReadStreamMethod = getReadStreamMethod =
              io.grpc.MethodDescriptor.<com.iptv.business.grpc.docreader.ReadRequest, com.iptv.business.grpc.docreader.ReadStreamResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ReadStream"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ReadRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ReadStreamResponse.getDefaultInstance()))
              .setSchemaDescriptor(new DocReaderMethodDescriptorSupplier("ReadStream"))
              .build();
        }
      }
    }
    return getReadStreamMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ListEnginesRequest,
      com.iptv.business.grpc.docreader.ListEnginesResponse> getListEnginesMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListEngines",
      requestType = com.iptv.business.grpc.docreader.ListEnginesRequest.class,
      responseType = com.iptv.business.grpc.docreader.ListEnginesResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ListEnginesRequest,
      com.iptv.business.grpc.docreader.ListEnginesResponse> getListEnginesMethod() {
    io.grpc.MethodDescriptor<com.iptv.business.grpc.docreader.ListEnginesRequest, com.iptv.business.grpc.docreader.ListEnginesResponse> getListEnginesMethod;
    if ((getListEnginesMethod = DocReaderGrpc.getListEnginesMethod) == null) {
      synchronized (DocReaderGrpc.class) {
        if ((getListEnginesMethod = DocReaderGrpc.getListEnginesMethod) == null) {
          DocReaderGrpc.getListEnginesMethod = getListEnginesMethod =
              io.grpc.MethodDescriptor.<com.iptv.business.grpc.docreader.ListEnginesRequest, com.iptv.business.grpc.docreader.ListEnginesResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListEngines"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ListEnginesRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.iptv.business.grpc.docreader.ListEnginesResponse.getDefaultInstance()))
              .setSchemaDescriptor(new DocReaderMethodDescriptorSupplier("ListEngines"))
              .build();
        }
      }
    }
    return getListEnginesMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static DocReaderStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DocReaderStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DocReaderStub>() {
        @java.lang.Override
        public DocReaderStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DocReaderStub(channel, callOptions);
        }
      };
    return DocReaderStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static DocReaderBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DocReaderBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DocReaderBlockingStub>() {
        @java.lang.Override
        public DocReaderBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DocReaderBlockingStub(channel, callOptions);
        }
      };
    return DocReaderBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static DocReaderFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DocReaderFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DocReaderFutureStub>() {
        @java.lang.Override
        public DocReaderFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DocReaderFutureStub(channel, callOptions);
        }
      };
    return DocReaderFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void read(com.iptv.business.grpc.docreader.ReadRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getReadMethod(), responseObserver);
    }

    /**
     */
    default void readStream(com.iptv.business.grpc.docreader.ReadRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadStreamResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getReadStreamMethod(), responseObserver);
    }

    /**
     */
    default void listEngines(com.iptv.business.grpc.docreader.ListEnginesRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ListEnginesResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListEnginesMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service DocReader.
   */
  public static abstract class DocReaderImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return DocReaderGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service DocReader.
   */
  public static final class DocReaderStub
      extends io.grpc.stub.AbstractAsyncStub<DocReaderStub> {
    private DocReaderStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DocReaderStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DocReaderStub(channel, callOptions);
    }

    /**
     */
    public void read(com.iptv.business.grpc.docreader.ReadRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getReadMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void readStream(com.iptv.business.grpc.docreader.ReadRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadStreamResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getReadStreamMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listEngines(com.iptv.business.grpc.docreader.ListEnginesRequest request,
        io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ListEnginesResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListEnginesMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service DocReader.
   */
  public static final class DocReaderBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<DocReaderBlockingStub> {
    private DocReaderBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DocReaderBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DocReaderBlockingStub(channel, callOptions);
    }

    /**
     */
    public com.iptv.business.grpc.docreader.ReadResponse read(com.iptv.business.grpc.docreader.ReadRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getReadMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<com.iptv.business.grpc.docreader.ReadStreamResponse> readStream(
        com.iptv.business.grpc.docreader.ReadRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getReadStreamMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.iptv.business.grpc.docreader.ListEnginesResponse listEngines(com.iptv.business.grpc.docreader.ListEnginesRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListEnginesMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service DocReader.
   */
  public static final class DocReaderFutureStub
      extends io.grpc.stub.AbstractFutureStub<DocReaderFutureStub> {
    private DocReaderFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DocReaderFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DocReaderFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.iptv.business.grpc.docreader.ReadResponse> read(
        com.iptv.business.grpc.docreader.ReadRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getReadMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.iptv.business.grpc.docreader.ListEnginesResponse> listEngines(
        com.iptv.business.grpc.docreader.ListEnginesRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListEnginesMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_READ = 0;
  private static final int METHODID_READ_STREAM = 1;
  private static final int METHODID_LIST_ENGINES = 2;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_READ:
          serviceImpl.read((com.iptv.business.grpc.docreader.ReadRequest) request,
              (io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadResponse>) responseObserver);
          break;
        case METHODID_READ_STREAM:
          serviceImpl.readStream((com.iptv.business.grpc.docreader.ReadRequest) request,
              (io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ReadStreamResponse>) responseObserver);
          break;
        case METHODID_LIST_ENGINES:
          serviceImpl.listEngines((com.iptv.business.grpc.docreader.ListEnginesRequest) request,
              (io.grpc.stub.StreamObserver<com.iptv.business.grpc.docreader.ListEnginesResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getReadMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.iptv.business.grpc.docreader.ReadRequest,
              com.iptv.business.grpc.docreader.ReadResponse>(
                service, METHODID_READ)))
        .addMethod(
          getReadStreamMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              com.iptv.business.grpc.docreader.ReadRequest,
              com.iptv.business.grpc.docreader.ReadStreamResponse>(
                service, METHODID_READ_STREAM)))
        .addMethod(
          getListEnginesMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.iptv.business.grpc.docreader.ListEnginesRequest,
              com.iptv.business.grpc.docreader.ListEnginesResponse>(
                service, METHODID_LIST_ENGINES)))
        .build();
  }

  private static abstract class DocReaderBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    DocReaderBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.iptv.business.grpc.docreader.DocReaderProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("DocReader");
    }
  }

  private static final class DocReaderFileDescriptorSupplier
      extends DocReaderBaseDescriptorSupplier {
    DocReaderFileDescriptorSupplier() {}
  }

  private static final class DocReaderMethodDescriptorSupplier
      extends DocReaderBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    DocReaderMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (DocReaderGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new DocReaderFileDescriptorSupplier())
              .addMethod(getReadMethod())
              .addMethod(getReadStreamMethod())
              .addMethod(getListEnginesMethod())
              .build();
        }
      }
    }
    return result;
  }
}
